import os

# Wrapper around the LLM API used for roadmaps and interview feedback.
# The API key is read from .env and never committed to GitHub.
LLM_API_KEY = os.getenv("LLM_API_KEY")


def generate(prompt: str) -> str:
    raise NotImplementedError("LLM integration will be added in the AI features phase")
