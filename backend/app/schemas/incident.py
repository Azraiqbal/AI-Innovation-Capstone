from typing import List
from pydantic import BaseModel, Field


class IncidentRequest(BaseModel):
    report: str = Field(..., min_length=10)


class IncidentAnalysis(BaseModel):
    language: str
    disaster_type: str
    severity: str

    people_at_risk_count: int
    trapped_people: bool
    electrocution_risk: bool
    fire_risk: bool

    risk_score: int
    priority: str

    main_risks: List[str]
    people_assets_at_risk: List[str]
    summary: str