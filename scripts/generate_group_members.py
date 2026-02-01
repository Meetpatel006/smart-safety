#!/usr/bin/env python3
"""
Generate sample group members CSV compatible with AddGroupMemberScreen.tsx
Usage:
  pip install faker
  python scripts/generate_group_members.py --count 30 --output data/group_members_sample.csv
"""

from faker import Faker
import csv
import random
import argparse

fake = Faker()

BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"]
GENDERS = ["Male","Female","Other"]


def random_gov_id():
    # Example pattern: AAAA-1111-BBBB
    part1 = fake.lexify(text="????").upper()
    part2 = fake.numerify(text="####")
    part3 = fake.lexify(text="????").upper()
    return f"{part1}-{part2}-{part3}"


def random_phone(country_code=None):
    # Generate an E.164-like phone with some realistic country codes
    codes = ["+91", "+1", "+44", "+61", "+81"]
    code = country_code or random.choice(codes)
    # create 9-10 digits after code
    num = "".join(str(random.randint(0,9)) for _ in range(10))
    return f"{code}{num}"


def random_date_of_birth(min_age=18, max_age=70):
    return fake.date_of_birth(minimum_age=min_age, maximum_age=max_age).strftime("%Y-%m-%d")


def generate_row():
    full_name = fake.name()
    date_of_birth = random_date_of_birth()
    nationality = fake.country()
    gender = random.choice(GENDERS)
    email = fake.ascii_free_email()
    # choose phone code based on nationality bias for +91 sometimes
    phone = random_phone("+91" if fake.boolean(chance_of_getting_true=50) else None)
    gov_id = random_gov_id()
    emergency_name = fake.name()
    emergency_contact = random_phone()
    blood_group = random.choice(BLOOD_GROUPS)

    return {
        "FullName": full_name,
        "DateOfBirth": date_of_birth,
        "Nationality": nationality,
        "Gender": gender,
        "Email": email,
        "Phone": phone,
        "GovID": gov_id,
        "EmergencyName": emergency_name,
        "EmergencyContact": emergency_contact,
        "BloodGroup": blood_group,
    }


def main(count=30, output_path="data/group_members_sample.csv"):
    header = [
        "FullName",
        "DateOfBirth",
        "Nationality",
        "Gender",
        "Email",
        "Phone",
        "GovID",
        "EmergencyName",
        "EmergencyContact",
        "BloodGroup",
    ]

    # ensure directory exists when run locally
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, mode="w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        for _ in range(count):
            writer.writerow(generate_row())

    print(f"Wrote {count} fake member rows to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate fake group members CSV")
    parser.add_argument("--count", type=int, default=30, help="Number of rows to generate")
    parser.add_argument("--output", type=str, default="data/group_members_sample.csv", help="Output CSV path")
    args = parser.parse_args()
    main(count=args.count, output_path=args.output)
