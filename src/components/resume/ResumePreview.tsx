import { memo } from 'react';
import { Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';
import { ResumeData } from './types';

interface ResumePreviewProps {
  data: ResumeData;
  id?: string;
  template?: 'classic' | 'modern' | 'minimal' | 'bold';
}

const A4Style = {
  fontFamily: 'Arial, sans-serif',
  minWidth: '794px',
  maxWidth: '794px',
  minHeight: '1123px',
} as const;

const formatLinkLabel = (url: string, fallback: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
};

const ClassicTemplate = ({ data }: { data: ResumeData }) => (
  <>
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
          <a href={data.personalInfo.linkedin} className="flex items-center text-blue-600 hover:underline">
            <Linkedin className="w-4 h-4 mr-2" />
            {formatLinkLabel(data.personalInfo.linkedin, 'LinkedIn')}
          </a>
        )}
        {data.personalInfo.github && (
          <a href={data.personalInfo.github} className="flex items-center text-blue-600 hover:underline">
            <Github className="w-4 h-4 mr-2" />
            {formatLinkLabel(data.personalInfo.github, 'GitHub')}
          </a>
        )}
      </div>
    </div>

    {data.education.some((edu) => edu.school) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-medium text-lg">{edu.school}</h3>
              <span className="text-gray-600 text-sm">{edu.year}</span>
            </div>
            <p className="text-gray-600">{edu.degree}</p>
          </div>
        ))}
      </div>
    )}

    {data.experience.some((exp) => exp.company) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Work Experience</h2>
        {data.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-medium text-lg">{exp.company}</h3>
              <span className="text-gray-600 text-sm">{exp.duration}</span>
            </div>
            <p className="text-gray-700 italic mb-2">{exp.position}</p>
            <div className="text-gray-600 whitespace-pre-line text-sm">{exp.description}</div>
          </div>
        ))}
      </div>
    )}

    {data.projects.some((proj) => proj.title) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Projects</h2>
        {data.projects.map((project, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-medium text-lg">{project.title}</h3>
            <p className="text-gray-700 text-sm italic mb-1">Technologies: {project.technologies}</p>
            <p className="text-gray-600 text-sm whitespace-pre-line">{project.description}</p>
          </div>
        ))}
      </div>
    )}

    {data.technicalSkills.some((skill) => skill) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Technical Skills</h2>
        <div className="flex flex-wrap gap-2">
          {data.technicalSkills.map(
            (skill, index) =>
              skill && (
                <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {skill}
                </span>
              )
          )}
        </div>
      </div>
    )}

    {data.certifications.some((cert) => cert) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Certifications</h2>
        <ul className="list-disc list-inside space-y-1">
          {data.certifications.map((cert, index) => cert && <li key={index} className="text-gray-600 text-sm">{cert}</li>)}
        </ul>
      </div>
    )}

    {data.achievements.some((ach) => ach) && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">Achievements</h2>
        <ul className="list-disc list-inside space-y-1">
          {data.achievements.map((ach, index) => ach && <li key={index} className="text-gray-600 text-sm">{ach}</li>)}
        </ul>
      </div>
    )}
  </>
);

const ModernTemplate = ({ data }: { data: ResumeData }) => {
  const contactItems = [
    data.personalInfo.email ? { label: data.personalInfo.email, icon: Mail } : null,
    data.personalInfo.phone ? { label: data.personalInfo.phone, icon: Phone } : null,
    data.personalInfo.location ? { label: data.personalInfo.location, icon: MapPin } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Mail }>;

  return (
    <div className="h-full">
      <div className="flex items-stretch h-full">
        <div className="w-[260px] bg-slate-900 text-white p-8">
          <div className="mb-6">
            <div className="text-2xl font-bold leading-tight">{data.personalInfo.name}</div>
            <div className="mt-2 text-slate-200 text-sm">Resume</div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-300">Contact</div>
              <div className="mt-2 space-y-2">
                {contactItems.map((c) => (
                  <div key={c.label} className="flex items-start gap-2 text-sm text-slate-100">
                    <c.icon className="w-4 h-4 mt-0.5 text-slate-300" />
                    <span className="break-words">{c.label}</span>
                  </div>
                ))}
                {data.personalInfo.linkedin && (
                  <a href={data.personalInfo.linkedin} className="flex items-start gap-2 text-sm text-slate-100 hover:underline">
                    <Linkedin className="w-4 h-4 mt-0.5 text-slate-300" />
                    <span className="break-words">{formatLinkLabel(data.personalInfo.linkedin, 'LinkedIn')}</span>
                  </a>
                )}
                {data.personalInfo.github && (
                  <a href={data.personalInfo.github} className="flex items-start gap-2 text-sm text-slate-100 hover:underline">
                    <Github className="w-4 h-4 mt-0.5 text-slate-300" />
                    <span className="break-words">{formatLinkLabel(data.personalInfo.github, 'GitHub')}</span>
                  </a>
                )}
              </div>
            </div>

            {data.technicalSkills.some((s) => s) && (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-300">Skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.technicalSkills.filter(Boolean).slice(0, 18).map((skill, i) => (
                    <span key={`${skill}-${i}`} className="text-xs bg-white/10 border border-white/15 px-2 py-1 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.certifications.some((c) => c) && (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-300">Certifications</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-100">
                  {data.certifications.filter(Boolean).slice(0, 6).map((c, i) => (
                    <li key={`${c}-${i}`} className="leading-snug">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-8">
          {data.experience.some((exp) => exp.company) && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-slate-500">Experience</div>
              <div className="mt-3 space-y-4">
                {data.experience.filter((e) => e.company).map((exp, index) => (
                  <div key={index}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-semibold text-slate-900">{exp.position || exp.company}</div>
                      <div className="text-xs text-slate-500">{exp.duration}</div>
                    </div>
                    <div className="text-sm text-slate-700">{exp.company}</div>
                    {exp.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{exp.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.projects.some((p) => p.title) && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-slate-500">Projects</div>
              <div className="mt-3 space-y-4">
                {data.projects.filter((p) => p.title).map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    {p.technologies && <div className="text-xs text-slate-500">{p.technologies}</div>}
                    {p.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{p.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education.some((e) => e.school) && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-slate-500">Education</div>
              <div className="mt-3 space-y-3">
                {data.education.filter((e) => e.school).map((edu, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-semibold text-slate-900">{edu.school}</div>
                      <div className="text-xs text-slate-500">{edu.year}</div>
                    </div>
                    <div className="text-sm text-slate-700">{edu.degree}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.achievements.some((a) => a) && (
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Achievements</div>
              <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-slate-600">
                {data.achievements.filter(Boolean).slice(0, 10).map((a, i) => (
                  <li key={`${a}-${i}`}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MinimalTemplate = ({ data }: { data: ResumeData }) => {
  const sectionTitle = (title: string) => (
    <div className="mt-6 mb-2">
      <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500">{title}</div>
      <div className="h-px bg-slate-200 mt-2" />
    </div>
  );

  return (
    <div className="text-slate-900">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-3xl font-bold">{data.personalInfo.name}</div>
          <div className="mt-2 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
            {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
            {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
            {data.personalInfo.github && <span>{data.personalInfo.github}</span>}
          </div>
        </div>
      </div>

      {data.experience.some((e) => e.company) && (
        <>
          {sectionTitle('Experience')}
          <div className="space-y-4">
            {data.experience.filter((e) => e.company || e.position).map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-semibold">{exp.position || exp.company}</div>
                  <div className="text-xs text-slate-500">{exp.duration}</div>
                </div>
                <div className="text-sm text-slate-700">{exp.company}</div>
                {exp.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{exp.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {data.projects.some((p) => p.title) && (
        <>
          {sectionTitle('Projects')}
          <div className="space-y-4">
            {data.projects.filter((p) => p.title).map((p, i) => (
              <div key={i}>
                <div className="font-semibold">{p.title}</div>
                {p.technologies && <div className="text-xs text-slate-500">{p.technologies}</div>}
                {p.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{p.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {data.education.some((e) => e.school) && (
        <>
          {sectionTitle('Education')}
          <div className="space-y-3">
            {data.education.filter((e) => e.school).map((edu, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-semibold">{edu.school}</div>
                  <div className="text-xs text-slate-500">{edu.year}</div>
                </div>
                <div className="text-sm text-slate-700">{edu.degree}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {(data.technicalSkills.some((s) => s) || data.certifications.some((c) => c) || data.achievements.some((a) => a)) && (
        <>
          {sectionTitle('Additional')}
          {data.technicalSkills.some((s) => s) && (
            <div className="text-sm text-slate-700">
              <span className="font-semibold">Skills:</span> {data.technicalSkills.filter(Boolean).join(', ')}
            </div>
          )}
          {data.certifications.some((c) => c) && (
            <div className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Certifications:</span> {data.certifications.filter(Boolean).join(', ')}
            </div>
          )}
          {data.achievements.some((a) => a) && (
            <div className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Achievements:</span> {data.achievements.filter(Boolean).join(', ')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const BoldTemplate = ({ data }: { data: ResumeData }) => {
  const contact = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join(' • ');
  return (
    <div className="h-full flex flex-col">
      <div className="bg-blue-700 text-white px-8 py-6">
        <div className="text-3xl font-bold">{data.personalInfo.name}</div>
        <div className="mt-2 text-sm text-blue-100">{contact}</div>
        <div className="mt-2 text-xs text-blue-100 flex flex-wrap gap-x-3 gap-y-1">
          {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
          {data.personalInfo.github && <span>{data.personalInfo.github}</span>}
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="space-y-6">
          {data.experience.some((e) => e.company) && (
            <div>
              <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Experience</div>
              <div className="mt-3 space-y-4">
                {data.experience.filter((e) => e.company).map((exp, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-semibold text-slate-900">{exp.company}</div>
                      <div className="text-xs text-slate-500">{exp.duration}</div>
                    </div>
                    <div className="text-sm text-slate-700 italic">{exp.position}</div>
                    {exp.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{exp.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.projects.some((p) => p.title) && (
            <div>
              <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Projects</div>
              <div className="mt-3 space-y-4">
                {data.projects.filter((p) => p.title).map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    {p.technologies && <div className="text-xs text-slate-500">{p.technologies}</div>}
                    {p.description && <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{p.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {data.education.some((e) => e.school) && (
              <div>
                <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Education</div>
                <div className="mt-3 space-y-3">
                  {data.education.filter((e) => e.school).map((edu, i) => (
                    <div key={i}>
                      <div className="font-semibold text-slate-900">{edu.school}</div>
                      <div className="text-sm text-slate-700">{edu.degree}</div>
                      <div className="text-xs text-slate-500">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              {data.technicalSkills.some((s) => s) && (
                <div>
                  <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Skills</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.technicalSkills.filter(Boolean).slice(0, 20).map((s, i) => (
                      <span key={`${s}-${i}`} className="text-xs bg-blue-50 text-blue-800 border border-blue-100 px-2 py-1 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.certifications.some((c) => c) && (
                <div className="mt-5">
                  <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Certifications</div>
                  <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-slate-600">
                    {data.certifications.filter(Boolean).slice(0, 8).map((c, i) => (
                      <li key={`${c}-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.achievements.some((a) => a) && (
                <div className="mt-5">
                  <div className="text-sm font-bold text-blue-700 border-l-4 border-blue-700 pl-3">Achievements</div>
                  <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-slate-600">
                    {data.achievements.filter(Boolean).slice(0, 8).map((a, i) => (
                      <li key={`${a}-${i}`}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResumePreview = memo(({ data, id = 'resume-preview', template = 'classic' }: ResumePreviewProps) => {
  const renderTemplate = () => {
    if (template === 'modern') return <ModernTemplate data={data} />;
    if (template === 'minimal') return <MinimalTemplate data={data} />;
    if (template === 'bold') return <BoldTemplate data={data} />;
    return <ClassicTemplate data={data} />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Resume Preview</h2>
      
      {/* Scrollable container for mobile */}
      <div className="overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div
          id={id}
          className="bg-white border rounded-lg shadow-lg mx-auto overflow-hidden"
          style={A4Style}
        >
          <div className="p-8 h-full">{renderTemplate()}</div>
      </div>
      </div>
      <p className="text-sm text-gray-500 text-center md:hidden">
        Scroll horizontally to view the full resume
      </p>
    </div>
  );
});

export default ResumePreview;
