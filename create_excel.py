import pandas as pd

# Create a DataFrame with sample data
recipients = [
    {"Name": "John Doe", "Amount": 1000, "Date": "2026-02-01", "Description": "Payment for services"},
    {"Name": "Jane Smith", "Amount": 1500, "Date": "2026-02-01", "Description": "Consulting fee"}
]
df = pd.DataFrame(recipients)
df.to_excel("recipients.xlsx", index=False)
print("recipients.xlsx created.")
