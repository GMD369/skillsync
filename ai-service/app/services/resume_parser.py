"""Resume text extraction and skill detection (Resume Analyzer, module M3).

Skills are matched with whole-word regular expressions, so for example
"Java" is not found inside "JavaScript" and "SQL" is not found inside "NoSQL".
Each skill can have several aliases (e.g. "Node", "NodeJS" -> "Node.js").
"""
import re

import pdfplumber

# Canonical skill name -> aliases (matched case-insensitively).
SKILLS: dict[str, list[str]] = {
    # Programming languages
    "Python": ["python"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript"],
    "Java": ["java"],
    "C++": ["c\\+\\+", "cpp"],
    "C#": ["c#", "c sharp"],
    "Go": ["golang"],
    "PHP": ["php"],
    "Ruby": ["ruby"],
    "Kotlin": ["kotlin"],
    "Swift": ["swiftui"],
    "Dart": [],
    "Rust": [],
    "SQL": ["sql"],
    "Bash": ["bash", "shell scripting"],
    # Frontend
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "React": ["react", "react\\.js", "reactjs"],
    "Next.js": ["next\\.js", "nextjs"],
    "Vue.js": ["vue", "vue\\.js", "vuejs"],
    "Angular": ["angular", "angularjs"],
    "Redux": ["redux"],
    "Tailwind CSS": ["tailwind", "tailwind css", "tailwindcss"],
    "Bootstrap": ["bootstrap"],
    "Sass": ["sass", "scss"],
    "jQuery": ["jquery"],
    # Backend
    "Node.js": ["node\\.js", "nodejs"],
    "Express.js": ["express\\.js", "expressjs"],
    "Django": ["django"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Spring Boot": ["spring boot", "springboot"],
    "Laravel": ["laravel"],
    "ASP.NET": ["asp\\.net", "\\.net core", "dotnet"],
    "REST APIs": ["rest api", "rest apis", "restful", "restful api"],
    "GraphQL": ["graphql"],
    "JWT": ["jwt", "json web tokens?"],
    # Databases
    "MongoDB": ["mongodb", "mongo", "mongoose"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "SQLite": ["sqlite"],
    "Redis": ["redis"],
    "Firebase": ["firebase"],
    # Data / AI
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning"],
    "NLP": ["nlp", "natural language processing"],
    "Computer Vision": ["computer vision", "opencv"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch"],
    "LangChain": ["langchain"],
    "LLMs": ["llm", "llms", "large language models?"],
    "Data Analysis": ["data analysis", "data analytics"],
    "Data Visualization": ["data visualization", "data visualisation", "matplotlib", "seaborn"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Excel": ["ms excel", "microsoft excel"],
    "Statistics": ["statistics", "statistical analysis"],
    # DevOps / tools
    "Git": ["git"],
    "GitHub": ["github"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "Google Cloud": ["gcp", "google cloud"],
    "Linux": ["linux", "ubuntu"],
    "CI/CD": ["ci/cd", "ci cd", "continuous integration", "github actions"],
    "Vercel": ["vercel"],
    "Postman": ["postman"],
    "Figma": ["figma"],
    # Mobile
    "React Native": ["react native"],
    "Flutter": ["flutter"],
    "Android": ["android"],
    # Practices
    "Testing": ["unit testing", "jest", "pytest", "test-driven development", "tdd", "testing"],
    "Agile": ["agile", "scrum"],
    "OOP": ["oop", "object[- ]oriented programming"],
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa"],
    "Responsive Design": ["responsive design", "responsive web design"],
    "UI/UX Design": ["ui/ux", "ux design", "ui design", "user experience"],
    # Soft skills
    "Communication": ["communication skills?", "communication"],
    "Teamwork": ["teamwork", "team player", "collaboration"],
    "Problem Solving": ["problem[- ]solving"],
    "Leadership": ["leadership"],
}

# Skills whose name is also a normal English word are only matched when written
# exactly like this (case-sensitive): "REST" but not "the rest of the team",
# "Excel" but not "I excel at", "Swift" but not "a swift learner".
CASE_SENSITIVE: dict[str, list[str]] = {
    "REST APIs": ["REST"],
    "Excel": ["Excel"],
    "Swift": ["Swift"],
    "Express.js": ["Express"],
    "Node.js": ["Node"],
    "Rust": ["Rust"],
    "Dart": ["Dart"],
}

# A skill must not be glued to other word characters, e.g. "java" inside "javascript".
_BEFORE = r"(?<![A-Za-z0-9+#.])"
_AFTER = r"(?![A-Za-z0-9+#])"


def _build(name: str) -> re.Pattern:
    parts = []
    if SKILLS.get(name):
        parts.append("(?i:" + "|".join(SKILLS[name]) + ")")
    parts += CASE_SENSITIVE.get(name, [])
    return re.compile(_BEFORE + "(?:" + "|".join(parts) + ")" + _AFTER)


_PATTERNS = {name: _build(name) for name in SKILLS}

# "React Native" should not also count as plain "React" unless React appears on its own.
_OVERLAPS = {"React": "React Native"}


def extract_text(pdf_file) -> str:
    """Read all text from a PDF resume. Raises ValueError if the file cannot be read."""
    try:
        with pdfplumber.open(pdf_file) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:  # pdfplumber raises several different error types
        raise ValueError("The file could not be read as a PDF") from exc


def find_skills(text: str) -> list[str]:
    """Return the canonical names of all skills found in the text, in a fixed order."""
    found = []
    for name, pattern in _PATTERNS.items():
        if name in _OVERLAPS:
            longer = _PATTERNS[_OVERLAPS[name]]
            if not pattern.search(longer.sub(" ", text)):
                continue
        elif not pattern.search(text):
            continue
        found.append(name)
    return found
