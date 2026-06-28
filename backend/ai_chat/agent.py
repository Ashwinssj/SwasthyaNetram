import os
from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from .ai_tools import (
    search_patients,
    analyze_patient_records,
    update_patient_medical_history,
    get_upcoming_appointments,
    create_patient,
    search_doctors,
    book_appointment
)

# 1. Define Agent State
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    hospital_id: int

# 2. Define Tools
# List of tools available to the agent
tools = [
    search_patients,
    analyze_patient_records,
    update_patient_medical_history,
    get_upcoming_appointments,
    create_patient,
    search_doctors,
    book_appointment
]

# 3. Define the Nodes

def call_model(state: AgentState):
    """Invokes the model with state messages and system instructions containing hospital context."""
    from users.context import get_gemini_api_key
    
    api_key = get_gemini_api_key()
    model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite')
    
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.2,
        google_api_key=api_key,
        thinking_level="minimal"
    )
    llm_with_tools = llm.bind_tools(tools)
    
    hospital_id = state.get("hospital_id")
    messages = state["messages"]
    
    # System Prompt Injection with dynamic hospital context
    system_instruction = (
        "You are Swasthya AI, a helpful medical assistant for doctors.\n"
        "You have legitimate access to patient data via tools.\n"
        "Use 'analyze_patient_records' to find patients by symptoms, medical history, or descriptions (Semantic Search).\n"
        "Use 'search_patients' to find patients by exact name before updating.\n"
        "ALWAYS confirm with the user before finalizing an update if unsure.\n"
        f"Current Hospital ID context: {hospital_id}\n"
    )
    
    # Inject system instruction as the very first message
    system_message = SystemMessage(content=system_instruction)
    all_messages = [system_message] + list(messages)
    
    # Invoke model
    response = llm_with_tools.invoke(all_messages)
    
    # Return state update (add the response message to history)
    return {"messages": [response]}

# 4. Construct the LangGraph State Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(tools))

# Add Entry point and Edges
workflow.add_edge(START, "agent")

# We use the prebuilt conditional edge `tools_condition` to route:
# - If the last message has tool calls, go to "tools" node
# - Otherwise, go to END
workflow.add_conditional_edges(
    "agent",
    tools_condition,
)

# After tools are executed, route back to agent node to process tool outputs
workflow.add_edge("tools", "agent")

# Compile the graph
agent_graph = workflow.compile()
