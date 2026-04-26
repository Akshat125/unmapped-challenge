"""World Bank Enterprise Surveys — skills constraints and vacancy signals.
Surfaces on the policymaker dashboard (§7.2 policymaker view).

TODO (requires network): live fetch from https://www.enterprisesurveys.org/
  Indicator: percentage of firms identifying inadequately educated workforce
             as a major constraint.
"""
from __future__ import annotations

from _common import write_output

WBES = {
    "GH": {
        "inadequately_educated_workforce_major_constraint_pct": 22.4,
        "firms_offering_formal_training_pct": 25.8,
        "unfilled_vacancies_pct": 14.2,
        "survey_year": 2023,
    },
    "BD": {
        "inadequately_educated_workforce_major_constraint_pct": 18.6,
        "firms_offering_formal_training_pct": 31.2,
        "unfilled_vacancies_pct": 11.8,
        "survey_year": 2022,
    },
}


def main() -> None:
    print("fetch_wbes: building Enterprise Surveys subset")
    write_output(
        "wbes.json",
        source="World Bank Enterprise Surveys (seed values, swap for live fetch)",
        values=WBES,
    )


if __name__ == "__main__":
    main()
