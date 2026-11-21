import io

import pytest

from app.services.resume_parser import extract_text, find_skills


def test_detects_common_web_skills():
    text = "Built a REST API with Node.js, Express and MongoDB. Familiar with Git and GitHub."
    assert {"Node.js", "Express.js", "MongoDB", "REST APIs", "Git", "GitHub"} <= set(find_skills(text))


def test_aliases_map_to_one_canonical_name():
    assert find_skills("NodeJS developer") == ["Node.js"]
    assert find_skills("node.js and nodejs") == ["Node.js"]
    assert find_skills("Experience with ReactJS") == ["React"]
    assert find_skills("Databases: Postgres") == ["PostgreSQL"]


def test_java_is_not_found_inside_javascript():
    assert find_skills("Frontend work in JavaScript") == ["JavaScript"]


def test_sql_is_not_found_inside_nosql_or_mysql():
    skills = find_skills("NoSQL databases and MySQL")
    assert "MySQL" in skills
    assert "SQL" not in skills


def test_special_characters_cpp_and_csharp():
    assert {"C++", "C#"} <= set(find_skills("Languages: C++, C#"))


def test_react_native_does_not_count_as_react():
    assert find_skills("Mobile apps with React Native") == ["React Native"]
    assert set(find_skills("React and React Native")) == {"React", "React Native"}


def test_case_insensitive_and_no_duplicates():
    assert find_skills("PYTHON python Python") == ["Python"]


def test_empty_text_returns_no_skills():
    assert find_skills("") == []


def test_invalid_pdf_raises_value_error():
    with pytest.raises(ValueError):
        extract_text(io.BytesIO(b"this is not a pdf"))


def test_common_english_words_are_not_skills():
    text = "I excel at teamwork, I am a swift learner and I help the rest of the team."
    skills = find_skills(text)
    assert "Excel" not in skills
    assert "Swift" not in skills
    assert "REST APIs" not in skills
    assert "Teamwork" in skills


def test_case_sensitive_technical_names_still_match():
    assert {"REST APIs", "Excel", "Node.js", "Express.js"} <= set(find_skills("Built REST services in Node and Express; reports in Excel"))
