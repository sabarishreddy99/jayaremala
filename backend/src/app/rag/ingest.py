"""Build the RAG knowledge base from backend/data/knowledge/*.json.

Strategy: atomic chunking — each bullet point, project, and skill category gets
its own document so retrieval is precise rather than scanning large blobs.
Also includes synthesized FAQ documents that pre-answer common recruiter questions.
"""

import json
import logging
from pathlib import Path

from app.rag.store import build_bm25_index, get_collection, reset_collection

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parents[3] / "data" / "knowledge"


def _load(filename: str) -> dict | list | None:
    path = DATA_DIR / filename
    if not path.exists():
        logger.warning("Missing knowledge file: %s", path)
        return None
    return json.loads(path.read_text())


def _build_documents() -> list[tuple[str, str, str]]:
    """Return list of (id, text, type) tuples — atomic chunks for precise retrieval."""
    docs: list[tuple[str, str, str]] = []

    # ── PROFILE ──────────────────────────────────────────────────────────────
    p = _load("profile.json")
    if p:
        docs.append(("profile_overview", (
            f"Jaya Sabarish Reddy Remala is a {p['tagline']}. "
            f"{p.get('summary', p['bio'])} "
            f"He is based in {p['location']}."
        ), "profile"))

        docs.append(("profile_bio", (
            f"About Jaya: {p['bio']}"
        ), "profile"))

        docs.append(("profile_contact", (
            f"Jaya's contact information — "
            f"Email: {p['email']}, "
            f"Phone: {p['phone']}, "
            f"GitHub: {p['github']}, "
            f"LinkedIn: {p['linkedin']}, "
            f"Location: {p['location']}. "
            f"Resume: {p.get('resume', '')}."
        ), "profile"))

    # ── EXPERIENCE ────────────────────────────────────────────────────────────
    exp_list = _load("experience.json")
    if exp_list:
        for i, e in enumerate(exp_list):
            company = e["company"]
            role = e["role"]
            period = f"{e['start']} – {e['end']}"
            tech = e.get("tech", "")

            # Role overview document
            docs.append((f"exp_{i}_overview", (
                f"Jaya worked as {role} at {company} ({period}). "
                f"{e.get('description', '')} "
                f"Technologies used: {tech}."
            ), "experience"))

            # One document per bullet — atomic for high-precision retrieval
            for j, bullet in enumerate(e.get("bullets", [])):
                docs.append((f"exp_{i}_bullet_{j}", (
                    f"At {company} as {role} ({period}): {bullet}"
                ), "experience"))

    # ── EDUCATION ─────────────────────────────────────────────────────────────
    edu_list = _load("education.json")
    if edu_list:
        for i, e in enumerate(edu_list):
            institution = e["institution"]
            degree = f"{e['degree']} in {e['field']}"
            period = f"{e['start']} – {e['end']}"
            gpa = e.get("gpa", "")

            docs.append((f"edu_{i}_overview", (
                f"Jaya studied {degree} at {institution} ({period}). "
                f"{'GPA: ' + gpa + '.' if gpa else ''}"
            ), "education"))

            for j, h in enumerate(e.get("highlights", [])):
                docs.append((f"edu_{i}_highlight_{j}", (
                    f"At {institution}: {h}"
                ), "education"))

    # ── PROJECTS ──────────────────────────────────────────────────────────────
    proj_list = _load("projects.json")
    if proj_list:
        for i, proj in enumerate(proj_list):
            title = proj["title"]
            tags = ", ".join(proj.get("tags", []))
            award = proj.get("award", "")
            award_str = f" This project won the {award}." if award else ""

            docs.append((f"proj_{i}_overview", (
                f"Project: {title}.{award_str} {proj['description']}"
            ), "project"))

            docs.append((f"proj_{i}_tech", (
                f"Technologies used in {title}: {tags}."
                f"{' Award: ' + award if award else ''}"
            ), "project"))

    # ── SKILLS ────────────────────────────────────────────────────────────────
    skills_list = _load("skills.json")
    if skills_list:
        for group in skills_list:
            category = group["category"]
            items = ", ".join(group["items"])
            slug = category.lower().replace(" ", "_").replace("&", "and")
            docs.append((f"skills_{slug}", (
                f"Jaya's {category} skills: {items}."
            ), "skills"))

        # Combined skills summary
        all_items = [item for g in skills_list for item in g["items"]]
        docs.append(("skills_all", (
            f"Jaya's full technical skill set spans: {', '.join(all_items)}."
        ), "skills"))

    # ── SYNTHESIZED FAQ DOCUMENTS ─────────────────────────────────────────────
    # These pre-answer the most common recruiter questions and dramatically
    # improve retrieval for broad/conversational queries.

    docs.append(("faq_who", (
        "Who is Jaya Sabarish Reddy Remala? Jaya is a Software Engineer with 3+ years of "
        "experience building production AI infrastructure and distributed systems. "
        "He won the Qualcomm Edge AI Hackathon, holds an MS in Computer Science from NYU Tandon "
        "(GPA 3.8/4.0), and has built systems handling 3,000+ RPS at 99.9% uptime. "
        "He specializes in Agentic AI, RAG pipelines, LLM inference optimization, and "
        "fault-tolerant distributed microservices."
    ), "faq"))

    docs.append(("faq_strengths", (
        "What makes Jaya stand out as an engineer? Key differentiators: "
        "(1) Won Qualcomm Edge AI Hackathon by achieving 15ms LLM inference on Snapdragon NPUs — "
        "10× faster than cloud inference — using QLoRA fine-tuning and AWQ quantization. "
        "(2) Cut RAG P99 latency by 78% (450ms → under 100ms) on a production system at 3K+ RPS. "
        "(3) Built zero-data-loss maritime telemetry for Shell PLC — 115GB/day, 200+ offshore stations. "
        "(4) Full-stack AI expertise from Edge NPU inference to distributed LangGraph multi-agent systems."
    ), "faq"))

    docs.append(("faq_experience_summary", (
        "Jaya's work experience summary: Software Engineer at NYU College of Arts and Science (Jun 2025–Present) "
        "building GeneCart genomics platform. Web Applications Lead at NYU IT (Sep 2024–May 2025) leading a "
        "production Multi-Agent Research Discovery Engine. Software Engineer Intern at NYU IT (May–Aug 2024) "
        "building high-concurrency distributed search infrastructure. Teaching Assistant at NYU (Sep 2024–May 2025) "
        "for Data Structures & Algorithms and ML for Bioinformatics. Software Engineer at Wipro/Shell PLC "
        "(Jul 2021–Feb 2023) building fault-tolerant maritime energy infrastructure. "
        "Full Stack Developer at VIT (Jan–Jun 2021) building gradeVITian serving 17K+ users."
    ), "faq"))

    docs.append(("faq_projects_summary", (
        "Jaya's notable projects: "
        "SnapLog (Qualcomm Edge AI Hackathon Winner) — 15ms LLM inference on Snapdragon NPUs via QLoRA + AWQ. "
        "CodeCollab — real-time collaborative code editor with CRDTs, AI auto-complete, scaled with Nginx. "
        "Multi-Agent Research Discovery Engine — LangGraph + Llama 3.1 70B, 3K+ RPS, 78% latency reduction. "
        "GeneCart — AI-powered genomics discovery platform at NYU (in progress). "
        "gradeVITian — grade forecasting PWA, 17K+ monthly users, #2 Google Search ranking."
    ), "faq"))

    docs.append(("faq_education_summary", (
        "Jaya's education: Master of Science in Computer Science from NYU Tandon School of Engineering "
        "(Aug 2023 – May 2025, GPA 3.8/4.0). Coursework includes Distributed Systems, Machine Learning, "
        "Design and Analysis of Algorithms, and Operating Systems. "
        "Bachelor of Technology in Electrical and Electronics Engineering from Vellore Institute of Technology "
        "(Jul 2017 – May 2021)."
    ), "faq"))

    docs.append(("faq_awards", (
        "Jaya's awards and recognition: Won the Qualcomm Edge AI Hackathon with SnapLog — "
        "an on-device security AI engine achieving 15ms inference on Snapdragon NPUs. "
        "Received the Outstanding Inclusivity Initiative award as Head of Operations at NYU Graduate Indian Student Association."
    ), "faq"))

    docs.append(("faq_ai_expertise", (
        "Jaya's AI and machine learning expertise: LangGraph multi-agent orchestration, RAG pipeline optimization, "
        "LLM fine-tuning with QLoRA, AWQ 4-bit quantization, ONNX Runtime deployment, Edge AI on Snapdragon NPUs, "
        "BGE-M3 dense embeddings, Reciprocal Rank Fusion (RRF) for retrieval, "
        "Voyage AI code embeddings, PyTorch, Llama 3.1 70B, Llama 3.2 3B, Claude 3.5."
    ), "faq"))

    docs.append(("faq_distributed_systems", (
        "Jaya's distributed systems expertise: horizontally-scaled async pipelines on AWS ECS with Kubernetes, "
        "Apache Kafka for fault-tolerant streaming (115GB/day), Redis Write-Through caching sustaining 3K+ RPS "
        "at sub-millisecond retrieval, circuit-breaker patterns for 99.9% uptime, "
        "zero-downtime rolling deployments with CI/CD, AsyncIO for parallel data fetching, "
        "event-driven Apex Async Micro-functions at Wipro/Shell."
    ), "faq"))

    docs.append(("faq_contact_hire", (
        "How to contact or hire Jaya Sabarish Reddy Remala: "
        "Email: jr6421@nyu.edu, Phone: +1 (516) 907-8727, "
        "LinkedIn: https://linkedin.com/in/jayasabarishreddyr, "
        "GitHub: https://github.com/sabarishreddy99. "
        "He is based in New York, NY and open to relocation."
    ), "faq"))

    docs.append(("faq_resume", (
        "Jaya's resume / CV is available at: "
        "https://drive.google.com/drive/u/0/folders/1vm35z-6VQjtO9A8ZBgCvvSP_7_POPTrV — "
        "You can download or view his full resume there. "
        "For direct contact: jr6421@nyu.edu or +1 (516) 907-8727."
    ), "faq"))

    docs.append(("faq_nyu_work", (
        "What did Jaya do at NYU? Jaya had three roles at NYU: "
        "As Web Applications Lead at NYU IT (2024–2025), he architected a production Multi-Agent Research Discovery Engine "
        "using LangGraph and Llama 3.1 70B, reducing RAG latency by 78% and sustaining 3K+ RPS. "
        "As a Software Engineer Intern at NYU IT (Summer 2024), he built FastAPI microservices on AWS ECS "
        "with AsyncIO parallel fetching and Redis caching. "
        "As a Software Engineer at NYU CAS (2025–Present), he is building GeneCart, "
        "an AI-assisted genomics discovery platform."
    ), "faq"))

    docs.append(("faq_shell_wipro", (
        "What did Jaya do at Wipro and Shell? Jaya was embedded at Shell PLC via Wipro (Jul 2021–Feb 2023). "
        "He built a fault-tolerant Apache Kafka pipeline processing 115GB/day across 200+ offshore crude oil stations in Brazil "
        "with zero data loss. He also reduced support tickets by 35% via a Self-Service Portal, "
        "increased fault tolerance by 39% by decomposing a Salesforce monolith into event-driven micro-functions, "
        "and reduced production incidents by 25% with a defensive ETL validation layer."
    ), "faq"))

    return docs


def run_ingest(force: bool = False) -> int:
    """Ingest knowledge base into ChromaDB. Returns number of documents upserted.
    BM25 index is always rebuilt from docs (in-memory, not persisted in ChromaDB).
    """
    if force:
        logger.info("Force re-ingest: resetting ChromaDB collection...")
        reset_collection()

    collection = get_collection()

    # Always build the document list — BM25 needs it even when ChromaDB is populated
    docs = _build_documents()

    if not force and collection.count() > 0:
        count = collection.count()
        logger.info("ChromaDB already populated (%d docs) — skipping upsert", count)
        build_bm25_index(docs)
        return count

    if not docs:
        logger.warning("No knowledge documents found in %s", DATA_DIR)
        return 0

    ids = [d[0] for d in docs]
    texts = [d[1] for d in docs]
    metadatas = [{"type": d[2], "id": d[0]} for d in docs]

    collection.upsert(ids=ids, documents=texts, metadatas=metadatas)
    build_bm25_index(docs)
    logger.info("Ingested %d documents into ChromaDB", len(docs))
    return len(docs)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    count = run_ingest(force=True)
    print(f"Ingested {count} documents.")
