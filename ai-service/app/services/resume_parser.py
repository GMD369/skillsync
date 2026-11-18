import pdfplumber

# Starter skill list; will be expanded and combined with spaCy NLP.
KNOWN_SKILLS = [
    "python", "javascript", "react", "next.js", "node.js", "express", "mongodb",
    "sql", "html", "css", "tailwind", "git", "docker", "machine learning",
]


def extract_text(pdf_file) -> str:
    """Read all text from a PDF resume."""
    with pdfplumber.open(pdf_file) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def find_skills(text: str) -> list[str]:
    """Simple keyword match - first version of skill detection."""
    lower = text.lower()
    return [skill for skill in KNOWN_SKILLS if skill in lower]
