using System.IO.Compression;
using System.Text;
using System.Xml.Linq;
using CVOlusturma.Models;
using Microsoft.AspNetCore.Mvc;

namespace CVOlusturma.Controllers;
[ApiController, Route("api/export")]
public sealed class ExportController : ControllerBase
{
    [HttpPost("word")]
    public IActionResult Word([FromBody] CvDocument cv)
    {
        var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            Add(zip, "[Content_Types].xml", ContentTypes); Add(zip, "_rels/.rels", Relationships);
            Add(zip, "word/document.xml", Document(cv));
        }
        stream.Position = 0;
        return File(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", Name(cv, "docx"));
    }
    [HttpPost("pdf")]
    public IActionResult Pdf([FromBody] CvDocument cv) => File(SimplePdf.Create(Lines(cv)), "application/pdf", Name(cv, "pdf"));
    static string Name(CvDocument cv,string ext) => $"{string.Concat((cv.FullName.Length>0?cv.FullName:"CV").Select(c=>char.IsLetterOrDigit(c)?c:'-')).Trim('-')}-CV.{ext}";
    static IEnumerable<string> Lines(CvDocument cv)
    {
        yield return cv.FullName; yield return cv.JobTitle; yield return $"{cv.Email}  |  {cv.Phone}  |  {cv.Location}";
        yield return ""; yield return "PROFESYONEL OZET"; yield return cv.Summary;
        foreach(var s in new[]{("DENEYIM",cv.Experiences),("EGITIM",cv.Educations),("PROJELER",cv.Projects),("SERTIFIKALAR",cv.Certifications)})
        { yield return ""; yield return s.Item1; foreach(var x in s.Item2){yield return $"{x.Title} - {x.Organization}";yield return $"{x.StartDate} - {x.EndDate}";yield return x.Description;} }
        yield return ""; yield return "BECERILER"; yield return string.Join("  /  ",cv.Skills.Select(x=>x.Name));
        yield return ""; yield return "DILLER"; yield return string.Join("  /  ",cv.Languages.Select(x=>x.Name));
    }
    static string Document(CvDocument cv)
    {
        XNamespace w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"; var body=new XElement(w+"body");
        void P(string text,bool bold=false,int size=22){if(string.IsNullOrWhiteSpace(text))return;body.Add(new XElement(w+"p",new XElement(w+"r",new XElement(w+"rPr",bold?new XElement(w+"b"):null,new XElement(w+"sz",new XAttribute(w+"val",size))),new XElement(w+"t",new XAttribute(XNamespace.Xml+"space","preserve"),text))));}
        P(cv.FullName,true,36);P(cv.JobTitle,false,24);P($"{cv.Email}  |  {cv.Phone}  |  {cv.Location}",false,18);P("PROFESYONEL ÖZET",true);P(cv.Summary);
        void S(string title,IEnumerable<CvEntry> entries){P(title,true);foreach(var x in entries){P($"{x.Title} — {x.Organization}",true);P($"{x.StartDate} - {x.EndDate}",false,18);P(x.Description);}}
        S("DENEYİM",cv.Experiences);S("EĞİTİM",cv.Educations);S("PROJELER",cv.Projects);S("SERTİFİKALAR",cv.Certifications);
        P("BECERİLER",true);P(string.Join(" • ",cv.Skills.Select(x=>x.Name)));P("DİLLER",true);P(string.Join(" • ",cv.Languages.Select(x=>x.Name)));
        body.Add(new XElement(w+"sectPr",new XElement(w+"pgSz",new XAttribute(w+"w","11906"),new XAttribute(w+"h","16838"))));
        return new XDocument(new XDeclaration("1.0","UTF-8","yes"),new XElement(w+"document",body)).ToString(SaveOptions.DisableFormatting);
    }
    static void Add(ZipArchive zip,string name,string content){using var writer=new StreamWriter(zip.CreateEntry(name).Open(),new UTF8Encoding(false));writer.Write(content);}
    const string ContentTypes="""<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>""";
    const string Relationships="""<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>""";
}
internal static class SimplePdf
{
    public static byte[] Create(IEnumerable<string> source)
    {
        var lines=source.SelectMany(Wrap).Take(54);var content=new StringBuilder("BT\n/F1 11 Tf\n50 790 Td\n");
        foreach(var line in lines)content.Append('(').Append(Escape(line)).Append(") Tj\n0 -14 Td\n");content.Append("ET");
        var objs=new[]{"<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",$"<< /Length {Encoding.ASCII.GetByteCount(content.ToString())} >>\nstream\n{content}\nendstream","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"};
        using var ms=new MemoryStream();using var wr=new StreamWriter(ms,Encoding.ASCII,leaveOpen:true){NewLine="\n"};wr.Write("%PDF-1.4\n");wr.Flush();var offsets=new List<long>{0};
        for(var i=0;i<objs.Length;i++){offsets.Add(ms.Position);wr.Write($"{i+1} 0 obj\n{objs[i]}\nendobj\n");wr.Flush();}var xref=ms.Position;wr.Write($"xref\n0 {objs.Length+1}\n0000000000 65535 f \n");foreach(var o in offsets.Skip(1))wr.Write($"{o:0000000000} 00000 n \n");wr.Write($"trailer\n<< /Size {objs.Length+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF");wr.Flush();return ms.ToArray();
    }
    static IEnumerable<string> Wrap(string text){if(string.IsNullOrWhiteSpace(text)){yield return "";yield break;}foreach(var p in text.Replace("\r","").Split('\n'))for(var rest=p;rest.Length>0;){var take=Math.Min(82,rest.Length);if(take<rest.Length){var space=rest.LastIndexOf(' ',take);if(space>20)take=space;}yield return rest[..take];rest=rest[take..].TrimStart();}}
    static string Escape(string v)=>string.Concat(v.Normalize(NormalizationForm.FormD).Where(c=>c<=127&&System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)!=System.Globalization.UnicodeCategory.NonSpacingMark)).Replace("\\","\\\\").Replace("(","\\(").Replace(")","\\)");
}
