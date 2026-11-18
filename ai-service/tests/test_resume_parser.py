from app.services.resume_parser import find_skills


def test_find_skills_detects_known_skills():
    text = "Built a REST API with Node.js, Express and MongoDB. Familiar with Git."
    assert set(find_skills(text)) >= {"node.js", "express", "mongodb", "git"}
