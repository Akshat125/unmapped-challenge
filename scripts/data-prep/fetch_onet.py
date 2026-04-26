"""O*NET task descriptions for the occupations in the demo subset. Joined
to the ISCO-08 codes via the committed SOC-to-ISCO crosswalk (§6.1).

TODO (requires network): replace the seed with a live fetch from the
O*NET Resource Center (https://www.onetcenter.org/database.html) —
specifically Task Statements.txt joined to Occupation Data.txt.
"""
from __future__ import annotations

from _common import write_output

# Keyed by SOC code. build_occupation_subset.py translates SOC → ISCO
# using the crosswalk CSV and logs unmatched SOC codes.
TASKS = {
    "49-3023.00": [  # Auto mechanic
        "Test drive vehicles and test components and systems, using equipment such as infrared engine analyzers.",
        "Repair or replace parts such as pistons, rods, gears, valves, and bearings.",
        "Confer with customers to obtain descriptions of vehicle problems.",
    ],
    "49-2097.00": [  # Electronic Equipment Installers
        "Install equipment such as navigation, radar, and communication systems.",
        "Inspect and test electronic equipment to locate causes of malfunction.",
    ],
    "49-2022.00": [  # Telecommunications Equipment Installers and Repairers
        "Install telecommunications equipment in residences or businesses.",
        "Test repaired, newly installed, or updated equipment to ensure that it functions properly.",
    ],
    "15-1254.00": [  # Web Developers
        "Write supporting code for web applications or websites.",
        "Design, build, or maintain websites using authoring or scripting languages.",
        "Identify problems uncovered by testing or customer feedback, and correct problems.",
    ],
    "15-1252.00": [  # Software Developers
        "Analyze user needs and software requirements to determine feasibility of design within time and cost constraints.",
        "Develop and direct software system testing and validation procedures, programming, and documentation.",
    ],
    "15-1232.00": [  # Computer User Support Specialists
        "Answer user inquiries regarding computer software or hardware operation to resolve problems.",
        "Set up equipment for employee use, performing or ensuring proper installation of cables, operating systems, or appropriate software.",
    ],
    "41-2031.00": [  # Retail Sales
        "Greet customers and ascertain what each customer wants or needs.",
        "Compute sales prices, total purchases, and receive and process cash or credit payment.",
    ],
    "51-6052.00": [  # Tailors, Dressmakers
        "Sew garments using a sewing machine or by hand.",
        "Measure parts such as sleeves or pant legs, and mark or pin-fold alterations.",
    ],
    "47-2031.00": [  # Carpenters
        "Measure and mark cutting lines on materials, using a ruler, pencil, chalk, and marking gauge.",
        "Assemble and fasten materials to make frameworks or props, using hand tools and wood screws.",
    ],
    "47-2152.00": [  # Plumbers
        "Assemble pipe sections, tubing, or fittings, using couplings, clamps, screws, bolts, cement, plastic solvent, caulking, or soldering, brazing, or welding equipment.",
        "Review blueprints, building codes, or specifications to determine work details or procedures.",
    ],
    "51-4121.00": [  # Welders
        "Operate safety equipment and use safe work habits.",
        "Weld components in flat, vertical, or overhead positions.",
    ],
    "53-3058.00": [  # Drivers
        "Follow safe driving practices and traffic laws.",
        "Transport passengers or goods to specified destinations.",
    ],
    "35-2014.00": [  # Cooks, Restaurant
        "Season and cook food according to recipes.",
        "Wash, peel, cut, and seed fruits and vegetables to prepare them for consumption.",
    ],
    "43-9061.00": [  # Office Clerks
        "Operate office machines, such as photocopiers and scanners, facsimile machines, voice mail systems, and personal computers.",
        "Answer telephones, direct calls, and take messages.",
    ],
    "43-4051.00": [  # Customer Service Representatives
        "Confer with customers by telephone or in person to provide information about products or services.",
        "Keep records of customer interactions or transactions.",
    ],
    "37-2012.00": [  # Cleaners
        "Clean rooms, hallways, lobbies, lounges, restrooms, corridors, elevators, stairways.",
    ],
    "45-2092.00": [  # Farmworkers
        "Harvest fruits and vegetables by hand.",
        "Operate tractors, tractor-drawn machinery, and self-propelled machinery to plow, cultivate, or harvest crops.",
    ],
}


def main() -> None:
    print("fetch_onet: building O*NET task subset")
    values = [{"soc_code": soc, "tasks": tasks} for soc, tasks in TASKS.items()]
    write_output(
        "onet_tasks.json",
        source="O*NET (US DOL) Task Statements (curated subset, seed data)",
        values=values,
    )


if __name__ == "__main__":
    main()
