from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from PyPDF2 import PdfReader, PdfWriter
import qrcode
import barcode
from barcode.writer import ImageWriter
import pandas as pd
import os
import argparse
import hashlib
import json
from datetime import datetime

def read_recipients_from_excel(file_path):
    df = pd.read_excel(file_path)
    return df.to_dict(orient='records')

def generate_receipt_hash(receipt_data):
    """Generate a unique hash for tamper detection"""
    data_string = json.dumps(receipt_data, sort_keys=True)
    return hashlib.sha256(data_string.encode()).hexdigest()

def generate_qr_and_barcode(receipt_id, receipt_data, output_dir):
    """Generate QR code and barcode for the receipt"""
    # Create verification URL (will be hosted on GitHub Pages)
    verify_url = f"https://Sir0Exclusive.github.io/payment-receipts/verify.html?id={receipt_id}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_path = os.path.join(output_dir, f"{receipt_id}_qr.png")
    qr_img.save(qr_path)
    
    # Generate barcode
    code128 = barcode.get_barcode_class('code128')
    barcode_obj = code128(receipt_id, writer=ImageWriter())
    barcode_path = os.path.join(output_dir, f"{receipt_id}_barcode")
    barcode_obj.save(barcode_path)
    
    return qr_path, f"{barcode_path}.png"

def save_receipt_data(receipt_id, receipt_data, receipt_hash, output_dir):
    """Save receipt data as JSON for web portal"""
    data = {
        'id': receipt_id,
        'data': receipt_data,
        'hash': receipt_hash,
        'timestamp': datetime.now().isoformat()
    }
    
    json_dir = os.path.join(output_dir, 'data')
    os.makedirs(json_dir, exist_ok=True)
    json_path = os.path.join(json_dir, f"{receipt_id}.json")
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    return json_path

def create_receipt_pdf(recipient, signature_path, output_path, name, qr_path, barcode_path, receipt_hash):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Draw border
    c.setLineWidth(2)
    c.rect(15 * mm, 15 * mm, width - 30 * mm, height - 30 * mm)

    # Header Box with Background
    c.setFillColorRGB(0.2, 0.3, 0.5)
    c.rect(20 * mm, height - 50 * mm, width - 40 * mm, 25 * mm, fill=True)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 38 * mm, "PAYMENT RECEIPT")
    c.setFillColorRGB(0, 0, 0)

    # Receipt Info Box
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, height - 60 * mm, f"Receipt No:")
    c.setFont("Helvetica", 10)
    c.drawString(50 * mm, height - 60 * mm, f"{recipient.get('Receipt No', 'AUTO')}")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(120 * mm, height - 60 * mm, f"Date:")
    c.setFont("Helvetica", 10)
    c.drawString(135 * mm, height - 60 * mm, f"{recipient['Date']}")

    # Issued By Section
    c.setLineWidth(0.5)
    c.rect(20 * mm, height - 85 * mm, width - 40 * mm, 20 * mm)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(25 * mm, height - 72 * mm, "Issued By:")
    c.setFont("Helvetica", 11)
    c.drawString(25 * mm, height - 80 * mm, f"{name}")

    # Received From Section
    c.rect(20 * mm, height - 110 * mm, width - 40 * mm, 20 * mm)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(25 * mm, height - 97 * mm, "Received From:")
    c.setFont("Helvetica", 11)
    c.drawString(25 * mm, height - 105 * mm, f"{recipient['Name']}")

    # Payment Details Table Header
    c.setFillColorRGB(0.9, 0.9, 0.9)
    c.rect(20 * mm, height - 130 * mm, width - 40 * mm, 10 * mm, fill=True)
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(25 * mm, height - 127 * mm, "Description")
    c.drawString(110 * mm, height - 127 * mm, "Amount (¥)")
    c.drawString(150 * mm, height - 127 * mm, "Due (¥)")

    # Payment Details Content
    c.setLineWidth(0.5)
    c.rect(20 * mm, height - 150 * mm, width - 40 * mm, 20 * mm)
    c.setFont("Helvetica", 10)
    c.drawString(25 * mm, height - 140 * mm, f"{recipient['Description']}")
    
    # Format amount in Yen
    amount = recipient['Amount']
    if not str(amount).startswith('¥'):
        amount = f"¥{amount}"
    due_amount = recipient.get('Due Amount', '')
    if due_amount and not str(due_amount).startswith('¥'):
        due_amount = f"¥{due_amount}"
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(110 * mm, height - 140 * mm, f"{amount}")
    c.drawString(150 * mm, height - 140 * mm, f"{due_amount}")

    # Total Box
    c.setFillColorRGB(0.95, 0.95, 0.95)
    c.rect(110 * mm, height - 165 * mm, 60 * mm, 10 * mm, fill=True)
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(112 * mm, height - 162 * mm, "Total Paid:")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(165 * mm, height - 162 * mm, f"{amount}")

    # Signature Section
    c.setLineWidth(0.5)
    c.rect(20 * mm, height - 200 * mm, 80 * mm, 30 * mm)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, height - 175 * mm, "Authorized Signature:")
    # Signature image
    c.drawImage(signature_path, 25 * mm, height - 195 * mm, width=40*mm, height=15*mm, mask='auto')

    # QR Code and Barcode Section
    c.rect(110 * mm, height - 200 * mm, 60 * mm, 30 * mm)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(112 * mm, height - 175 * mm, "Scan to Verify:")
    # QR Code
    c.drawImage(qr_path, 112 * mm, height - 197 * mm, width=25*mm, height=25*mm)
    # Barcode
    c.drawImage(barcode_path, 140 * mm, height - 197 * mm, width=28*mm, height=20*mm)

    # Verification Hash (tamper-proof)
    c.setFont("Helvetica", 7)
    c.drawString(20 * mm, height - 210 * mm, f"Verification Hash: {receipt_hash[:32]}...")

    # Footer Section
    c.setLineWidth(1)
    c.line(20 * mm, 35 * mm, width - 20 * mm, 35 * mm)
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(width / 2, 28 * mm, "This is a computer-generated receipt and is valid without a stamp.")
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width / 2, 22 * mm, "Thank you for your payment!")

    c.save()

def lock_pdf(input_pdf, output_pdf):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    # Set permissions: allow printing and viewing, disallow editing
    writer.add_metadata(reader.metadata)
    writer.encrypt(user_password="", owner_password="owner123", permissions_flag=0b0000010000000100)
    with open(output_pdf, "wb") as f:
        writer.write(f)


def main():
    parser = argparse.ArgumentParser(description="Generate payment receipts.")
    parser.add_argument('--name', type=str, help='Recipient name')
    parser.add_argument('--amount', type=str, help='Amount in Yen')
    parser.add_argument('--due', type=str, help='Due Amount in Yen')
    parser.add_argument('--date', type=str, help='Date')
    parser.add_argument('--desc', type=str, help='Description')
    parser.add_argument('--receipt', type=str, help='Receipt No')
    args = parser.parse_args()

    signature_path = "signature.png"
    output_dir = "receipts"
    os.makedirs(output_dir, exist_ok=True)
    author_name = "RABIUL MD SARWAR IBNA"

    if args.name and args.amount and args.date and args.desc:
        # Generate for a single recipient (from command line)
        recipient = {
            'Name': args.name,
            'Amount': args.amount,
            'Due Amount': args.due if args.due else '',
            'Date': args.date,
            'Description': args.desc,
            'Receipt No': args.receipt if args.receipt else 'AUTO'
        }
        receipt_id = args.receipt if args.receipt else f"R{datetime.now().strftime('%Y%m%d%H%M%S')}"
        receipt_hash = generate_receipt_hash(recipient)
        qr_path, barcode_path = generate_qr_and_barcode(receipt_id, recipient, output_dir)
        save_receipt_data(receipt_id, recipient, receipt_hash, output_dir)
        
        temp_pdf = os.path.join(output_dir, f"{recipient['Name']}_temp.pdf")
        final_pdf = os.path.join(output_dir, f"{recipient['Name']}_receipt.pdf")
        create_receipt_pdf(recipient, signature_path, temp_pdf, author_name, qr_path, barcode_path, receipt_hash)
        lock_pdf(temp_pdf, final_pdf)
        os.remove(temp_pdf)
        print(f"Receipt generated for {recipient['Name']} in {output_dir}/")
    else:
        # Generate for all recipients in Excel
        excel_path = "recipients.xlsx"
        recipients = read_recipients_from_excel(excel_path)
        for recipient in recipients:
            receipt_id = str(recipient.get('Receipt No', f"R{datetime.now().strftime('%Y%m%d%H%M%S')}"))
            receipt_hash = generate_receipt_hash(recipient)
            qr_path, barcode_path = generate_qr_and_barcode(receipt_id, recipient, output_dir)
            save_receipt_data(receipt_id, recipient, receipt_hash, output_dir)
            
            temp_pdf = os.path.join(output_dir, f"{recipient['Name']}_temp.pdf")
            final_pdf = os.path.join(output_dir, f"{recipient['Name']}_receipt.pdf")
            create_receipt_pdf(recipient, signature_path, temp_pdf, author_name, qr_path, barcode_path, receipt_hash)
            lock_pdf(temp_pdf, final_pdf)
            os.remove(temp_pdf)
        print(f"Receipts generated in {output_dir}/")

if __name__ == "__main__":
    main()

