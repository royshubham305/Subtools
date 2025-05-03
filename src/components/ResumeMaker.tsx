import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Plus, Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';
import DownloadProgress from './DownloadProgress';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  education: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    title: string;
    technologies: string;
    description: string;
  }>;
  technicalSkills: string[];
  certifications: string[];
  achievements: string[];
}

const initialData: ResumeData = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
  },
  education: [{ school: '', degree: '', year: '' }],
  experience: [{ company: '', position: '', duration: '', description: '' }],
  projects: [{ title: '', technologies: '', description: '' }],
  technicalSkills: [''],
  certifications: [''],
  achievements: [''],
};

export default function ResumeMaker() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(initialData);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }));
  };

  const updateEducation = (index: number, field: keyof ResumeData['education'][0], value: string) => {
    setData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prev, education: newEducation };
    });
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '' }]
    }));
  };

  const updateExperience = (index: number, field: keyof ResumeData['experience'][0], value: string) => {
    setData(prev => {
      const newExperience = [...prev.experience];
      newExperience[index] = { ...newExperience[index], [field]: value };
      return { ...prev, experience: newExperience };
    });
  };

  const addProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', technologies: '', description: '' }]
    }));
  };

  const updateProject = (index: number, field: keyof ResumeData['projects'][0], value: string) => {
    setData(prev => {
      const newProjects = [...prev.projects];
      newProjects[index] = { ...newProjects[index], [field]: value };
      return { ...prev, projects: newProjects };
    });
  };

  const addTechnicalSkill = () => {
    setData(prev => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, '']
    }));
  };

  const updateTechnicalSkill = (index: number, value: string) => {
    setData(prev => {
      const newSkills = [...prev.technicalSkills];
      newSkills[index] = value;
      return { ...prev, technicalSkills: newSkills };
    });
  };

  const addCertification = () => {
    setData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index: number, value: string) => {
    setData(prev => {
      const newCertifications = [...prev.certifications];
      newCertifications[index] = value;
      return { ...prev, certifications: newCertifications };
    });
  };

  const addAchievement = () => {
    setData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setData(prev => {
      const newAchievements = [...prev.achievements];
      newAchievements[index] = value;
      return { ...prev, achievements: newAchievements };
    });
  };

  const handleDownload = async () => {
    const element = document.getElementById('resume-preview');
    if (element) {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // 4-second download animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2.5;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(async () => {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            pdf.save('resume.pdf');
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 100);
        }
      }, 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Resume Maker for CSE Students</h1>

      <DownloadProgress
        progress={downloadProgress}
        fileName="resume.pdf"
        show={isDownloading}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-4 py-2 rounded-lg mx-1 min-w-[100px] ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Step {s}
              </button>
            ))}
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Location"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                />
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                />
                <input
                  type="url"
                  placeholder="GitHub URL"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={data.personalInfo.github || ''}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Education</h2>
              {data.education.map((edu, index) => (
                <div key={index} className="space-y-4 mb-6 p-4 bg-gray-50 rounded">
                  <input
                    type="text"
                    placeholder="School/University"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={edu.school}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={edu.year}
                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  />
                </div>
              ))}
              <button
                onClick={addEducation}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Education
              </button>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Work Experience</h2>
              {data.experience.map((exp, index) => (
                <div key={index} className="space-y-4 mb-6 p-4 bg-gray-50 rounded">
                  <input
                    type="text"
                    placeholder="Company"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., Jan 2020 - Present)"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  />
                  <textarea
                    placeholder="Description (Use bullet points)"
                    className="p-2 border rounded w-full h-32 focus:ring-2 focus:ring-blue-500"
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  />
                </div>
              ))}
              <button
                onClick={addExperience}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Experience
              </button>
            </div>
          )}

          {/* Step 4: Projects */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Projects</h2>
              {data.projects.map((project, index) => (
                <div key={index} className="space-y-4 mb-6 p-4 bg-gray-50 rounded">
                  <input
                    type="text"
                    placeholder="Project Title"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={project.title}
                    onChange={(e) => updateProject(index, 'title', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Technologies Used (comma separated)"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={project.technologies}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                  />
                  <textarea
                    placeholder="Project Description"
                    className="p-2 border rounded w-full h-32 focus:ring-2 focus:ring-blue-500"
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                  />
                </div>
              ))}
              <button
                onClick={addProject}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Project
              </button>
            </div>
          )}

          {/* Step 5: Technical Skills */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Technical Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.technicalSkills.map((skill, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Skill (e.g., Python, React)"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={skill}
                    onChange={(e) => updateTechnicalSkill(index, e.target.value)}
                  />
                ))}
              </div>
              <button
                onClick={addTechnicalSkill}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Skill
              </button>
            </div>
          )}

          {/* Step 6: Certifications */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.certifications.map((certification, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Certification (e.g., AWS Certified Developer)"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={certification}
                    onChange={(e) => updateCertification(index, e.target.value)}
                  />
                ))}
              </div>
              <button
                onClick={addCertification}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Certification
              </button>
            </div>
          )}

          {/* Step 7: Achievements */}
          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.achievements.map((achievement, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Achievement (e.g., Hackathon Winner)"
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    value={achievement}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                  />
                ))}
              </div>
              <button
                onClick={addAchievement}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Achievement
              </button>
            </div>
          )}

          {/* Step 8: Preview */}
          {step === 8 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Resume Preview</h2>
              <div
                id="resume-preview"
                className="bg-white p-8 border rounded-lg shadow-inner"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {/* Header Section */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">{data.personalInfo.name}</h1>
                  <div className="flex flex-wrap justify-center gap-4 text-gray-600 text-sm">
                    {data.personalInfo.email && (
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {data.personalInfo.email}
                      </p>
                    )}
                    {data.personalInfo.phone && (
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {data.personalInfo.phone}
                      </p>
                    )}
                    {data.personalInfo.location && (
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {data.personalInfo.location}
                      </p>
                    )}
                    {data.personalInfo.linkedin && (
                      <a
                        href={data.personalInfo.linkedin}
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    )}
                    {data.personalInfo.github && (
                      <a
                        href={data.personalInfo.github}
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </a>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                {data.education.some(edu => edu.school) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Education
                    </h2>
                    {data.education.map((edu, index) => (
                      <div key={index} className="mb-4">
                        <h3 className="font-medium text-lg">{edu.school}</h3>
                        <p className="text-gray-600">{edu.degree}</p>
                        <p className="text-gray-500 text-sm">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience Section */}
                {data.experience.some(exp => exp.company) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Experience
                    </h2>
                    {data.experience.map((exp, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-lg">{exp.company}</h3>
                          <span className="text-gray-500 text-sm">{exp.duration}</span>
                        </div>
                        <p className="text-gray-600">{exp.position}</p>
                        <ul className="mt-2 list-disc list-inside pl-4">
                          {exp.description.split('\n').map((line, i) => (
                            <li key={i} className="text-gray-600">{line}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects Section */}
                {data.projects.some(project => project.title) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Projects
                    </h2>
                    {data.projects.map((project, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-lg">{project.title}</h3>
                          <span className="text-gray-500 text-sm">{project.technologies}</span>
                        </div>
                        <ul className="mt-2 list-disc list-inside pl-4">
                          {project.description.split('\n').map((line, i) => (
                            <li key={i} className="text-gray-600">{line}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Technical Skills Section */}
                {data.technicalSkills.some(skill => skill.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Technical Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {data.technicalSkills.map((skill, index) => (
                        skill.trim() && (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications Section */}
                {data.certifications.some(cert => cert.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Certifications
                    </h2>
                    <ul className="list-disc list-inside pl-4">
                      {data.certifications.map((certification, index) => (
                        certification.trim() && (
                          <li key={index} className="text-gray-600">
                            {certification}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}

                {/* Achievements Section */}
                {data.achievements.some(ach => ach.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">
                      Achievements
                    </h2>
                    <ul className="list-disc list-inside pl-4">
                      {data.achievements.map((achievement, index) => (
                        achievement.trim() && (
                          <li key={index} className="text-gray-600">
                            {achievement}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Resume as PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}