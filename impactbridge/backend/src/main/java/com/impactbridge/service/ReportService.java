package com.impactbridge.service;

import com.impactbridge.entity.Corporate;
import com.impactbridge.entity.Match;
import com.impactbridge.entity.Ngo;
import com.impactbridge.repository.CorporateRepository;
import com.impactbridge.repository.MatchRepository;
import com.impactbridge.repository.NgoRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final CorporateRepository corporateRepository;
    private final MatchRepository matchRepository;
    private final NgoRepository ngoRepository;

    public byte[] generateCsrReport(UUID corporateId) throws DocumentException {
        Corporate corp = corporateRepository.findById(corporateId)
                .orElseThrow(() -> new RuntimeException("Corporate not found"));

        List<Match> matches = matchRepository.findByCorporateIdOrderByOverallScoreDesc(corporateId)
                .stream().filter(m -> "FUNDED".equals(m.getStatus()) || "INTERESTED".equals(m.getStatus()))
                .toList();

        Document document = new Document(PageSize.A4, 36, 36, 54, 54);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.DARK_GRAY);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK);

        // Header
        Paragraph header = new Paragraph("ImpactBridge CSR Compliance Report", titleFont);
        header.setAlignment(Element.ALIGN_CENTER);
        document.add(header);
        document.add(new Paragraph(" "));

        // Corporate Details
        document.add(new Paragraph("Corporate Profile", subTitleFont));
        document.add(new Paragraph("Name: " + corp.getName(), normalFont));
        document.add(new Paragraph("Sector: " + corp.getSector(), normalFont));
        document.add(new Paragraph("Focus Theme: " + corp.getFocusTheme(), normalFont));
        
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        document.add(new Paragraph("Total CSR Budget: " + format.format(corp.getCsrBudget()), normalFont));
        document.add(new Paragraph(" "));

        // Table of Selected NGOs
        document.add(new Paragraph("Selected NGOs & Projects", subTitleFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 2f, 2f, 2f});

        addTableHeader(table, boldFont, "NGO Name", "Theme", "Status", "Compliance Score");

        for (Match m : matches) {
            Ngo ngo = ngoRepository.findById(m.getNgoId()).orElse(null);
            if (ngo != null) {
                table.addCell(new Phrase(ngo.getName(), normalFont));
                table.addCell(new Phrase(ngo.getTheme(), normalFont));
                table.addCell(new Phrase(m.getStatus(), normalFont));
                table.addCell(new Phrase(String.valueOf(m.getComplianceScore()), normalFont));
            }
        }
        document.add(table);
        
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Schedule VII & SDG Compliance", subTitleFont));
        document.add(new Paragraph("All funded projects listed above align with Schedule VII of the Companies Act 2013 and contribute towards the UN Sustainable Development Goals (SDGs).", normalFont));

        document.close();
        return out.toByteArray();
    }

    private void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }
}
