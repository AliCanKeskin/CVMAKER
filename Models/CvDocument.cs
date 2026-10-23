namespace CVOlusturma.Models;
public sealed class CvDocument
{
    public string FullName { get; set; } = ""; public string JobTitle { get; set; } = "";
    public string Email { get; set; } = ""; public string Phone { get; set; } = "";
    public string Location { get; set; } = ""; public string Website { get; set; } = "";
    public string LinkedIn { get; set; } = ""; public string Summary { get; set; } = "";
    public List<CvEntry> Experiences { get; set; } = []; public List<CvEntry> Educations { get; set; } = [];
    public List<CvEntry> Projects { get; set; } = []; public List<CvEntry> Certifications { get; set; } = [];
    public List<CvSkill> Skills { get; set; } = []; public List<CvSkill> Languages { get; set; } = [];
}
public sealed class CvEntry { public string Title { get; set; }=""; public string Organization { get; set; }=""; public string StartDate { get; set; }=""; public string EndDate { get; set; }=""; public string Description { get; set; }=""; }
public sealed class CvSkill { public string Name { get; set; }=""; public int Level { get; set; }=3; }
