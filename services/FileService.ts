
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';

export const generateExcel = (data: any[][], fileName: string = "Hinata_Sheet.xlsx") => {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, fileName);
};

export const generateWord = async (title: string, content: string, fileName: string = "Hinata_Doc.docx") => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              size: 24,
            }),
          ],
          spacing: { before: 200 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
};

export const generatePPT = (slides: { title: string, body: string }[], fileName: string = "Hinata_Presentation.pptx") => {
  const pptx = new pptxgen();
  slides.forEach(s => {
    const slide = pptx.addSlide();
    slide.addText(s.title, { x: 0.5, y: 1, w: "90%", h: 1, fontSize: 32, color: "363636", bold: true, align: "center" });
    slide.addText(s.body, { x: 0.5, y: 2.5, w: "90%", h: 3, fontSize: 18, color: "666666", bullet: true });
    slide.background = { color: "F1F1F1" };
  });
  pptx.writeFile({ fileName });
};

export const generatePDF = (images: string[], fileName: string = "Hinata_Portfolio.pdf") => {
  const pdf = new jsPDF();
  images.forEach((imgData, index) => {
    if (index > 0) pdf.addPage();
    // Add image with aspect ratio consideration
    // Assuming A4 size: 210 x 297 mm
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = imgProps.width / imgProps.height;
    const width = pdfWidth - 20;
    const height = width / ratio;
    
    pdf.addImage(imgData, 'JPEG', 10, 10, width, Math.min(height, pdfHeight - 20));
  });
  pdf.save(fileName);
};
