import pandas as pd

def read_recipients_from_excel(file_path):
    """
    Reads recipient details from an Excel file.
    Expects columns: Name, Amount, Date, Description, etc.
    Returns a list of dictionaries.
    """
    df = pd.read_excel(file_path)
    return df.to_dict(orient='records')

if __name__ == "__main__":
    # Example usage
    recipients = read_recipients_from_excel('recipients.xlsx')
    for r in recipients:
        print(r)
