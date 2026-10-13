export interface SkillTemplateInput {
  skillName: string;
  description?: string;
  instruction: string;
}

/**
 * 根据表单内容生成 Markdown 技能模板。
 * 模板结构对齐后端 ai_skills 的 file_content，可直接编辑后再次上传覆盖。
 */
export function buildSkillMarkdown(input: SkillTemplateInput): string {
  const lines = [`# ${input.skillName.trim()}`];

  const description = input.description?.trim();
  if (description) {
    lines.push('', '## 技能描述', description);
  }

  lines.push('', '## 执行指令', input.instruction.trim());
  lines.push('', '## 输出约定', '- 使用简体中文回答', '- 先给结论，再补充必要的说明');

  return lines.join('\n');
}

/** 技能名 → 合法文件名 */
export function toSkillFileName(skillName: string): string {
  const safe = skillName.trim().replace(/[\\/:*?"<>|]/g, '-');
  return `${safe || 'skill'}.md`;
}

/**
 * 技能名 → 目录名。
 * 每个技能独占一个目录，目录内固定放 skills.md，方便按名称直接定位与调用。
 */
export function toSkillDirectory(skillName: string): string {
  const safe = skillName
    .trim()
    .replace(/[/\\]/g, '-')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\.+$/g, '');
  return safe || 'skill';
}

/** 技能文件在文件仓中的固定文件名 */
export const SKILL_FILE_NAME = 'skills.md';

/** 把生成的 Markdown 包装成可上传的 File */
export function createMarkdownFile(fileName: string, content: string): File {
  return new File([content], fileName, { type: 'text/markdown' });
}

/** 下载 Markdown 到本地，便于二次编辑 */
export function downloadMarkdown(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

