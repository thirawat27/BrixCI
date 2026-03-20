import { nodejsTemplateGraph } from './nodejs'
import { dockerTemplateGraph } from './docker'
import { reactGhPagesTemplateGraph } from './react-gh-pages'
import { npmPublishTemplateGraph } from './npm-publish'
import { pythonDjangoTemplateGraph } from './python-django'
import { goCiTemplateGraph } from './go-ci'
import { rustCargoTemplateGraph } from './rust-cargo'
import { releaseDrafterTemplateGraph } from './release-drafter'
import { phpLaravelTemplateGraph } from './php-laravel'
import { terraformTemplateGraph } from './terraform'
import type { GraphState } from '../graph'
import type { UiLanguage } from '../../i18n'

export interface TemplateConfig {
  id: string
  label: Record<UiLanguage, string>
  description: Record<UiLanguage, string>
  graph: GraphState
}

export const builtInTemplates: TemplateConfig[] = [
  { 
    id: 'nodejs', 
    label: { en: 'Node.js CI', th: 'Node.js CI', zh: 'Node.js CI' }, 
    description: { 
      en: 'Test and lint Node.js projects', 
      th: 'ทดสอบและตรวจสอบความถูกต้องของระบบ Node.js', 
      zh: '测试和检查 Node.js 项目' 
    }, 
    graph: nodejsTemplateGraph 
  },
  { 
    id: 'docker', 
    label: { en: 'Docker Build & Push', th: 'สร้างและอัปโหลด Docker', zh: '构建并推送到 Docker' }, 
    description: { 
      en: 'Build and push Docker images to registries', 
      th: 'บิลด์และอัปโหลด Docker image ไปยัง Registry', 
      zh: '构建并将 Docker 镜像推送到镜像仓库' 
    }, 
    graph: dockerTemplateGraph 
  },
  { 
    id: 'react-gh-pages', 
    label: { en: 'React/Vite to GH Pages', th: 'React/Vite ไปยัง GH Pages', zh: '部署 React/Vite 到 GH Pages' }, 
    description: { 
      en: 'Build and deploy React app to GitHub Pages', 
      th: 'สร้างและนำ React app ไปรันบน GitHub Pages', 
      zh: '构建并将 React 应用部署到 GitHub Pages' 
    }, 
    graph: reactGhPagesTemplateGraph 
  },
  { 
    id: 'npm-publish', 
    label: { en: 'NPM Package Publish', th: 'อัปโหลดแพ็กเกจ NPM', zh: '发布 NPM 包' }, 
    description: { 
      en: 'Publish packages to NPM registry', 
      th: 'เผยแพร่แพ็กเกจของคุณไปยัง NPM Registry อัตโนมัติ', 
      zh: '将包自动发布到 NPM 注册表' 
    }, 
    graph: npmPublishTemplateGraph 
  },
  { 
    id: 'python-django', 
    label: { en: 'Python Django CI', th: 'Python Django CI', zh: 'Python Django CI' }, 
    description: { 
      en: 'Run tests for Django applications', 
      th: 'ทดสอบการทำงานของแอปพลิเคชัน Django อัตโนมัติ', 
      zh: '自动运行 Django 应用程序的测试' 
    }, 
    graph: pythonDjangoTemplateGraph 
  },
  { 
    id: 'go-ci', 
    label: { en: 'Go Build & Test', th: 'Go Build & Test', zh: 'Go 构建与测试' }, 
    description: { 
      en: 'Build and test Go programs', 
      th: 'คอมไพล์และตรวจสอบโค้ดภาษา Go', 
      zh: '自动构建并测试 Go 程序' 
    }, 
    graph: goCiTemplateGraph 
  },
  { 
    id: 'rust-cargo', 
    label: { en: 'Rust Cargo Build & Test', th: 'Rust Cargo Build & Test', zh: 'Rust Cargo 构建与测试' }, 
    description: { 
      en: 'Build and test Rust projects', 
      th: 'คอมไพล์และทดสอบระบบด้วย Rust Cargo แบบมี Cache', 
      zh: '构建并测试 Rust 项目，并添加缓存' 
    }, 
    graph: rustCargoTemplateGraph 
  },
  { 
    id: 'php-laravel', 
    label: { en: 'PHP Laravel CI', th: 'PHP Laravel CI', zh: 'PHP Laravel CI' }, 
    description: { 
      en: 'Run PHPUnit tests for Laravel', 
      th: 'รันการทดสอบ PHPUnit อัตโนมัติสำหรับโปรเจกต์ Laravel', 
      zh: '运行针对 Laravel 的 PHPUnit 自动化测试' 
    }, 
    graph: phpLaravelTemplateGraph 
  },
  { 
    id: 'terraform', 
    label: { en: 'Terraform Plan & Apply', th: 'Terraform Plan & Apply', zh: 'Terraform Plan & Apply' }, 
    description: { 
      en: 'Provision infrastructure using Terraform', 
      th: 'จัดการและปรับโครงสร้างพื้นฐานด้วย Terraform อัตโนมัติ', 
      zh: '使用 Terraform 自动化部署和更新基础设施' 
    }, 
    graph: terraformTemplateGraph 
  },
  { 
    id: 'release-drafter', 
    label: { en: 'Release Drafter', th: 'Release Drafter', zh: 'Release Drafter' }, 
    description: { 
      en: 'Draft release notes automatically', 
      th: 'ร่างเอกสาร Release Note ให้อัตโนมัติตาม Labels', 
      zh: '根据标签自动起草引人注目的版本发布说明' 
    }, 
    graph: releaseDrafterTemplateGraph 
  },
]
