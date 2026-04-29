import { useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ChevronLeft, ChevronRight, User, GraduationCap, Briefcase, FolderGit2, Wrench, Award, Trophy, FileText, Check, RotateCcw } from 'lucide-react';
import DownloadProgress from './DownloadProgress';
import { ResumeData, initialData } from './resume/types';
import PersonalInfoForm from './resume/PersonalInfoForm';
import EducationForm from './resume/EducationForm';
import ExperienceForm from './resume/ExperienceForm';
import ProjectsForm from './resume/ProjectsForm';
import SkillsForm from './resume/SkillsForm';
import CertificationsForm from './resume/CertificationsForm';
import AchievementsForm from './resume/AchievementsForm';
import ResumePreview from './resume/ResumePreview';

export default function ResumeMaker() {
  const steps = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Education', icon: GraduationCap },
    { id: 3, label: 'Experience', icon: Briefcase },
    { id: 4, label: 'Projects', icon: FolderGit2 },
    { id: 5, label: 'Skills', icon: Wrench },
    { id: 6, label: 'Certifications', icon: Award },
    { id: 7, label: 'Achievements', icon: Trophy },
    { id: 8, label: 'Preview', icon: FileText },
  ];

  // Initialize state from localStorage if available
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('resume_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('resume_data');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [template, setTemplate] = useState<'classic' | 'modern' | 'minimal' | 'bold'>(() => {
    const saved = localStorage.getItem('resume_template');
    return (saved as 'classic' | 'modern' | 'minimal' | 'bold') || 'classic';
  });

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('resume_step', step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem('resume_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('resume_template', template);
  }, [template]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setData(initialData);
      setStep(1);
      setTemplate('classic');
      localStorage.removeItem('resume_data');
      localStorage.removeItem('resume_step');
      localStorage.removeItem('resume_template');
    }
  };

  const progressPercent = `${((step - 1) / (steps.length - 1)) * 100}%`;
  const getStepState = (id: number) => ({
    active: step === id,
    complete: step > id,
    reached: step >= id,
  });

  const currentStepItem = steps.find((s) => s.id === step) ?? steps[0];
  const nextStepItem = steps.find((s) => s.id === step + 1) ?? null;
  const visibleSteps = nextStepItem ? [currentStepItem, nextStepItem] : [currentStepItem];

  const updatePersonalInfo = useCallback((field: keyof ResumeData['personalInfo'], value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  }, []);

  const addEducation = useCallback(() => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: keyof ResumeData['education'][0], value: string) => {
    setData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prev, education: newEducation };
    });
  }, []);

  const removeEducation = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  }, []);

  const addExperience = useCallback(() => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '' }]
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: keyof ResumeData['experience'][0], value: string) => {
    setData(prev => {
      const newExperience = [...prev.experience];
      newExperience[index] = { ...newExperience[index], [field]: value };
      return { ...prev, experience: newExperience };
    });
  }, []);

  const removeExperience = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  }, []);

  const addProject = useCallback(() => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', technologies: '', description: '' }]
    }));
  }, []);

  const updateProject = useCallback((index: number, field: keyof ResumeData['projects'][0], value: string) => {
    setData(prev => {
      const newProjects = [...prev.projects];
      newProjects[index] = { ...newProjects[index], [field]: value };
      return { ...prev, projects: newProjects };
    });
  }, []);

  const removeProject = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  }, []);

  const addTechnicalSkill = useCallback(() => {
    setData(prev => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, '']
    }));
  }, []);

  const updateTechnicalSkill = useCallback((index: number, value: string) => {
    setData(prev => {
      const newSkills = [...prev.technicalSkills];
      newSkills[index] = value;
      return { ...prev, technicalSkills: newSkills };
    });
  }, []);

  const removeTechnicalSkill = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((_, i) => i !== index)
    }));
  }, []);

  const addCertification = useCallback(() => {
    setData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  }, []);

  const updateCertification = useCallback((index: number, value: string) => {
    setData(prev => {
      const newCertifications = [...prev.certifications];
      newCertifications[index] = value;
      return { ...prev, certifications: newCertifications };
    });
  }, []);

  const removeCertification = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  }, []);

  const addAchievement = useCallback(() => {
    setData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  }, []);

  const updateAchievement = useCallback((index: number, value: string) => {
    setData(prev => {
      const newAchievements = [...prev.achievements];
      newAchievements[index] = value;
      return { ...prev, achievements: newAchievements };
    });
  }, []);

  const removeAchievement = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  }, []);

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

  const nextStep = () => {
    if (step < 8) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-4">
      <div className="mb-8 text-center relative">
        <h1 className="text-3xl font-bold mb-2">Free Resume Builder (Beta)</h1>
        <p className="text-slate-500 max-w-2xl mx-auto mb-4">
          Build a professional resume in minutes. Our step-by-step <strong>CV maker</strong> guides you through adding education, experience, and skills. Download your resume as a clean, ATS-friendly PDF ready for job applications.
        </p>
        <button
          onClick={handleReset}
          className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset / Start Over
        </button>
      </div>

      <DownloadProgress
        progress={downloadProgress}
        fileName="resume.pdf"
        show={isDownloading}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-8">
          <nav className="mb-8" aria-label="Resume steps">
            <div className="hidden md:block">
              <div className="text-sm font-medium text-slate-700 mb-3 text-center">
                Step {step} of {steps.length}: {currentStepItem.label}
              </div>
            </div>

            <ol className="hidden md:flex justify-between items-center relative mb-12 px-4 max-w-xl mx-auto w-full" role="list">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-0 rounded-full" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-0 transition-all duration-500 ease-out rounded-full"
                style={{ width: progressPercent }}
              />
              {visibleSteps.map((s) => {
                const state = getStepState(s.id);
                const Icon = state.complete ? Check : s.icon;
                return (
                  <li key={s.id} className="relative z-10">
                    <button
                      type="button"
                      onClick={() => setStep(s.id)}
                      aria-current={state.active ? 'step' : undefined}
                      className="flex flex-col items-center group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform ${
                          state.reached
                            ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
                            : 'bg-white border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`absolute -bottom-8 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                          state.reached ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="md:hidden">
              <div className="text-sm font-medium text-slate-700 mb-3">Step {step} of {steps.length}</div>
            </div>

            <div className="md:hidden flex items-center justify-center gap-3 pb-4" role="tablist" aria-label="Resume step tabs">
              {visibleSteps.map((s) => {
                const state = getStepState(s.id);
                const Icon = state.complete ? Check : s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    role="tab"
                    aria-selected={state.active}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
                      state.active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {step === 1 && <PersonalInfoForm data={data.personalInfo} updateData={updatePersonalInfo} />}
          {step === 2 && (
            <EducationForm
              data={data.education}
              updateData={updateEducation}
              addItem={addEducation}
              removeItem={removeEducation}
            />
          )}
          {step === 3 && (
            <ExperienceForm
              data={data.experience}
              updateData={updateExperience}
              addItem={addExperience}
              removeItem={removeExperience}
            />
          )}
          {step === 4 && (
            <ProjectsForm
              data={data.projects}
              updateData={updateProject}
              addItem={addProject}
              removeItem={removeProject}
            />
          )}
          {step === 5 && (
            <SkillsForm
              data={data.technicalSkills}
              updateData={updateTechnicalSkill}
              addItem={addTechnicalSkill}
              removeItem={removeTechnicalSkill}
            />
          )}
          {step === 6 && (
            <CertificationsForm
              data={data.certifications}
              updateData={updateCertification}
              addItem={addCertification}
              removeItem={removeCertification}
            />
          )}
          {step === 7 && (
            <AchievementsForm
              data={data.achievements}
              updateData={updateAchievement}
              addItem={addAchievement}
              removeItem={removeAchievement}
            />
          )}
          {step === 8 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="text-sm font-medium text-slate-700">Template</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: 'classic', label: 'Classic' },
                      { key: 'modern', label: 'Modern' },
                      { key: 'minimal', label: 'Minimal' },
                      { key: 'bold', label: 'Bold' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTemplate(t.key)}
                      className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                        template === t.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResumePreview data={data} template={template} />
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t md:static fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none md:p-0 md:bg-transparent z-10 gap-4">
            <button
              onClick={prevStep}
              disabled={step === 1}
              type="button"
              className={`flex items-center justify-center flex-1 md:flex-none px-6 py-2 rounded-lg ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            {step === 8 ? (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                type="button"
                className="flex items-center justify-center flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                type="button"
                className="flex items-center justify-center flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
