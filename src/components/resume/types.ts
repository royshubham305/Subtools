export interface ResumeData {
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

export const initialData: ResumeData = {
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
