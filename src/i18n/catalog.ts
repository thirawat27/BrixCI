import type { ValidationIssueCode } from '../domain/graph/types'

export const UI_LANGUAGES = ['en', 'th', 'zh'] as const
export type UiLanguage = (typeof UI_LANGUAGES)[number]

export interface UiDictionary {
  languageName: string
  appTitle: string
  appSubtitle: string
  workflow: string
  workflowName: string
  workflowNameHelp: string
  env: string
  envHelp: string
  matrix: string
  matrixHelp: string
  failFast: string
  groupCreate: string
  groupBuild: string
  groupTransfer: string
  groupHistory: string
  addTrigger: string
  addJob: string
  addStep: string
  validate: string
  compile: string
  exportYaml: string
  copyYaml: string
  exportGraphJson: string
  importGraphJson: string
  importYaml: string
  undo: string
  redo: string
  reset: string
  language: string
  saved: string
  autosaveOn: string
  nodes: string
  edges: string
  validation: string
  noGraphIssues: string
  inspector: string
  selectNode: string
  deleteNode: string
  duplicateNode: string
  fitView: string
  nodeId: string
  nodeType: string
  nodeData: string
  yamlOutput: string
  yamlPlaceholder: string
  structureFirst: string
  structureCaption: string
  errorsAndWarnings: string
  tabInspector: string
  tabYaml: string
  triggerNode: string
  jobNode: string
  stepNode: string
  label: string
  event: string
  branches: string
  cron: string
  name: string
  jobId: string
  runsOn: string
  mode: string
  command: string
  action: string
  withParams: string
  jobRef: string
  unassigned: string
  restoredDraft: string
  compileSuccess: string
  compileFailed: string
  exportSuccess: string
  copySuccess: string
  copyFailed: string
  importSuccess: string
  importFailed: string
  importYamlSuccess: string
  importYamlFailed: string
  resetConfirm: string
  validatePassed: string
  validateFailed: string
}

export const UI_DICTIONARY: Record<UiLanguage, UiDictionary> = {
  en: {
    languageName: 'English',
    appTitle: 'BrixCI Editor',
    appSubtitle: 'Visual GitHub Actions pipeline builder',
    workflow: 'Workflow',
    workflowName: 'Workflow Name',
    workflowNameHelp: 'Used for compiled YAML output and editor draft restore.',
    env: 'Environment',
    envHelp: 'Use one key=value pair per line.',
    matrix: 'Matrix Strategy',
    matrixHelp: 'Use one axis=value1, value2 line per axis.',
    failFast: 'Fail fast',
    groupCreate: 'Create Nodes',
    groupBuild: 'Build Workflow',
    groupTransfer: 'Import / Export',
    groupHistory: 'History',
    addTrigger: 'Add Trigger',
    addJob: 'Add Job',
    addStep: 'Add Step',
    validate: 'Validate',
    compile: 'Compile',
    exportYaml: 'Export YAML',
    copyYaml: 'Copy YAML',
    exportGraphJson: 'Export Graph JSON',
    importGraphJson: 'Import Graph JSON',
    importYaml: 'Import YAML',
    undo: 'Undo',
    redo: 'Redo',
    reset: 'Reset',
    language: 'Language',
    saved: 'Saved',
    autosaveOn: 'Auto-save on',
    nodes: 'Nodes',
    edges: 'Edges',
    validation: 'Validation',
    noGraphIssues: 'No graph issues detected.',
    inspector: 'Inspector',
    selectNode: 'Select a node to inspect details.',
    deleteNode: 'Delete Node',
    duplicateNode: 'Duplicate',
    fitView: 'Fit View',
    nodeId: 'Node ID',
    nodeType: 'Type',
    nodeData: 'Data',
    yamlOutput: 'YAML Output',
    yamlPlaceholder: 'Run Compile to generate GitHub Actions YAML.',
    structureFirst: 'Structure First',
    structureCaption:
      'This mode prioritizes graph correctness, deterministic compile output, and stable editing behavior.',
    errorsAndWarnings: 'errors / warnings',
    tabInspector: 'Inspector',
    tabYaml: 'YAML',
    triggerNode: 'Trigger',
    jobNode: 'Job',
    stepNode: 'Step',
    label: 'Label',
    event: 'Event',
    branches: 'Branches (comma separated)',
    cron: 'Cron',
    name: 'Name',
    jobId: 'Job ID',
    runsOn: 'Runs-on',
    mode: 'Mode',
    command: 'Command',
    action: 'Action',
    withParams: 'with (key=value per line)',
    jobRef: 'Job Ref',
    unassigned: 'unassigned',
    restoredDraft: 'Draft restored from local storage.',
    compileSuccess: 'YAML compiled successfully.',
    compileFailed: 'Compile failed. Fix validation errors first.',
    exportSuccess: 'YAML exported successfully.',
    copySuccess: 'YAML copied to clipboard.',
    copyFailed: 'Unable to copy YAML to clipboard.',
    importSuccess: 'Graph JSON imported successfully.',
    importFailed: 'Import failed. Invalid graph JSON format.',
    importYamlSuccess: 'Workflow YAML imported successfully.',
    importYamlFailed: 'Import failed. Unsupported or invalid GitHub Actions YAML.',
    resetConfirm: 'Reset the current graph? This action cannot be undone.',
    validatePassed: 'Validation passed with no blocking errors.',
    validateFailed: 'Validation found blocking errors.',
  },
  th: {
    languageName: 'ไทย',
    appTitle: 'BrixCI Editor',
    appSubtitle: 'ตัวแก้ไข Pipeline แบบ Visual สำหรับ GitHub Actions',
    workflow: 'Workflow',
    workflowName: 'ชื่อ Workflow',
    workflowNameHelp: 'ใช้กับผลลัพธ์ YAML ที่คอมไพล์และการกู้คืน draft ของ editor',
    env: 'Environment',
    envHelp: 'ใช้รูปแบบ key=value หนึ่งคู่ต่อหนึ่งบรรทัด',
    matrix: 'Matrix Strategy',
    matrixHelp: 'ใช้รูปแบบ axis=value1, value2 หนึ่งแกนต่อหนึ่งบรรทัด',
    failFast: 'Fail fast',
    groupCreate: 'สร้างโหนด',
    groupBuild: 'ตรวจสอบและคอมไพล์',
    groupTransfer: 'นำเข้า / ส่งออก',
    groupHistory: 'ประวัติการแก้ไข',
    addTrigger: 'เพิ่ม Trigger',
    addJob: 'เพิ่ม Job',
    addStep: 'เพิ่ม Step',
    validate: 'ตรวจสอบ',
    compile: 'คอมไพล์',
    exportYaml: 'ส่งออก YAML',
    copyYaml: 'คัดลอก YAML',
    exportGraphJson: 'ส่งออก Graph JSON',
    importGraphJson: 'นำเข้า Graph JSON',
    importYaml: 'นำเข้า YAML',
    undo: 'ย้อนกลับ',
    redo: 'ทำซ้ำ',
    reset: 'รีเซ็ต',
    language: 'ภาษา',
    saved: 'บันทึกล่าสุด',
    autosaveOn: 'เปิดบันทึกอัตโนมัติ',
    nodes: 'โหนด',
    edges: 'เส้นเชื่อม',
    validation: 'ผลตรวจสอบ',
    noGraphIssues: 'ไม่พบปัญหาในกราฟ',
    inspector: 'ตัวตรวจสอบ',
    selectNode: 'เลือกโหนดเพื่อดูรายละเอียด',
    deleteNode: 'ลบโหนด',
    duplicateNode: 'ทำซ้ำ',
    fitView: 'พอดีหน้าจอ',
    nodeId: 'รหัสโหนด',
    nodeType: 'ประเภท',
    nodeData: 'ข้อมูล',
    yamlOutput: 'ผลลัพธ์ YAML',
    yamlPlaceholder: 'กดคอมไพล์เพื่อสร้าง GitHub Actions YAML',
    structureFirst: 'โครงสร้างมาก่อน',
    structureCaption:
      'โหมดนี้เน้นความถูกต้องของกราฟ, การคอมไพล์แบบคงที่, และพฤติกรรมการแก้ไขที่เสถียร',
    errorsAndWarnings: 'ข้อผิดพลาด / คำเตือน',
    tabInspector: 'Inspector',
    tabYaml: 'YAML',
    triggerNode: 'Trigger',
    jobNode: 'Job',
    stepNode: 'Step',
    label: 'ชื่อแสดงผล',
    event: 'Event',
    branches: 'สาขา (คั่นด้วย ,)',
    cron: 'Cron',
    name: 'ชื่อ',
    jobId: 'Job ID',
    runsOn: 'Runs-on',
    mode: 'โหมด',
    command: 'คำสั่ง',
    action: 'Action',
    withParams: 'with (key=value ต่อบรรทัด)',
    jobRef: 'อ้างอิง Job',
    unassigned: 'ยังไม่ผูก',
    restoredDraft: 'กู้คืน draft จาก local storage แล้ว',
    compileSuccess: 'คอมไพล์ YAML สำเร็จ',
    compileFailed: 'คอมไพล์ไม่สำเร็จ โปรดแก้ validation error ก่อน',
    exportSuccess: 'ส่งออก YAML สำเร็จ',
    copySuccess: 'คัดลอก YAML แล้ว',
    copyFailed: 'ไม่สามารถคัดลอก YAML ไปคลิปบอร์ดได้',
    importSuccess: 'นำเข้า Graph JSON สำเร็จ',
    importFailed: 'นำเข้าไม่สำเร็จ รูปแบบ Graph JSON ไม่ถูกต้อง',
    importYamlSuccess: 'นำเข้า Workflow YAML สำเร็จ',
    importYamlFailed: 'นำเข้าไม่สำเร็จ YAML ของ GitHub Actions ไม่ถูกต้องหรือยังไม่รองรับ',
    resetConfirm: 'ต้องการรีเซ็ตกราฟปัจจุบันหรือไม่? การกระทำนี้ย้อนกลับไม่ได้',
    validatePassed: 'ตรวจสอบผ่าน ไม่มีข้อผิดพลาดที่บล็อกการทำงาน',
    validateFailed: 'พบข้อผิดพลาดที่ต้องแก้ก่อนดำเนินการต่อ',
  },
  zh: {
    languageName: '中文',
    appTitle: 'BrixCI 编辑器',
    appSubtitle: '可视化 GitHub Actions 流水线构建器',
    workflow: 'Workflow',
    workflowName: 'Workflow 名称',
    workflowNameHelp: '用于编译后的 YAML 输出和编辑器草稿恢复。',
    env: 'Environment',
    envHelp: '每行使用一个 key=value。',
    matrix: 'Matrix Strategy',
    matrixHelp: '每行使用一个 axis=value1, value2。',
    failFast: 'Fail fast',
    groupCreate: '创建节点',
    groupBuild: '校验与编译',
    groupTransfer: '导入 / 导出',
    groupHistory: '历史记录',
    addTrigger: '新增 Trigger',
    addJob: '新增 Job',
    addStep: '新增 Step',
    validate: '校验',
    compile: '编译',
    exportYaml: '导出 YAML',
    copyYaml: '复制 YAML',
    exportGraphJson: '导出 Graph JSON',
    importGraphJson: '导入 Graph JSON',
    importYaml: '导入 YAML',
    undo: '撤销',
    redo: '重做',
    reset: '重置',
    language: '语言',
    saved: '最近保存',
    autosaveOn: '已开启自动保存',
    nodes: '节点',
    edges: '连线',
    validation: '校验结果',
    noGraphIssues: '未发现图结构问题。',
    inspector: '检查器',
    selectNode: '请选择一个节点查看详情。',
    deleteNode: '删除节点',
    duplicateNode: '复制',
    fitView: '适配视图',
    nodeId: '节点 ID',
    nodeType: '类型',
    nodeData: '数据',
    yamlOutput: 'YAML 输出',
    yamlPlaceholder: '点击编译以生成 GitHub Actions YAML。',
    structureFirst: '先保证结构',
    structureCaption: '该模式优先保证图结构正确、编译结果确定性和编辑稳定性。',
    errorsAndWarnings: '错误 / 警告',
    tabInspector: '检查器',
    tabYaml: 'YAML',
    triggerNode: 'Trigger',
    jobNode: 'Job',
    stepNode: 'Step',
    label: '标签',
    event: '事件',
    branches: '分支（逗号分隔）',
    cron: 'Cron',
    name: '名称',
    jobId: 'Job ID',
    runsOn: 'Runs-on',
    mode: '模式',
    command: '命令',
    action: 'Action',
    withParams: 'with（每行 key=value）',
    jobRef: 'Job 引用',
    unassigned: '未分配',
    restoredDraft: '已从本地存储恢复草稿。',
    compileSuccess: 'YAML 编译成功。',
    compileFailed: '编译失败，请先修复校验错误。',
    exportSuccess: 'YAML 导出成功。',
    copySuccess: 'YAML 已复制到剪贴板。',
    copyFailed: '无法复制 YAML 到剪贴板。',
    importSuccess: 'Graph JSON 导入成功。',
    importFailed: '导入失败，Graph JSON 格式无效。',
    importYamlSuccess: 'Workflow YAML 导入成功。',
    importYamlFailed: '导入失败，GitHub Actions YAML 无效或暂不受支持。',
    resetConfirm: '确定重置当前图吗？此操作无法撤销。',
    validatePassed: '校验通过，没有阻塞性错误。',
    validateFailed: '校验发现阻塞性错误。',
  },
}

export const ISSUE_DICTIONARY: Record<
  UiLanguage,
  Partial<Record<ValidationIssueCode, string>>
> = {
  en: {
    CYCLE_DETECTED: 'Cycle detected in DAG.',
    DUPLICATE_JOB_ID: 'Duplicate jobId detected.',
    INVALID_EDGE: 'Invalid node connection.',
    JOB_WITHOUT_STEPS: 'Job has no step.',
    MISSING_NODE: 'Edge references a missing node.',
    NO_JOB: 'No job node found.',
    NO_TRIGGER: 'No trigger node found.',
    ORPHAN_JOB: 'Job is not connected from trigger.',
    STEP_CHAIN_CROSS_JOB: 'Step chain cannot cross jobs.',
    STEP_JOB_NOT_FOUND: 'Step is not assigned to a valid job.',
  },
  th: {
    CYCLE_DETECTED: 'พบวงวนใน DAG',
    DUPLICATE_JOB_ID: 'พบ jobId ซ้ำ',
    INVALID_EDGE: 'การเชื่อมต่อโหนดไม่ถูกต้อง',
    JOB_WITHOUT_STEPS: 'Job นี้ยังไม่มี Step',
    MISSING_NODE: 'เส้นเชื่อมอ้างอิงโหนดที่หายไป',
    NO_JOB: 'ไม่พบโหนด Job',
    NO_TRIGGER: 'ไม่พบโหนด Trigger',
    ORPHAN_JOB: 'Job ยังไม่เชื่อมจาก Trigger',
    STEP_CHAIN_CROSS_JOB: 'Step chain ห้ามข้าม Job',
    STEP_JOB_NOT_FOUND: 'Step ยังไม่ผูกกับ Job ที่ถูกต้อง',
  },
  zh: {
    CYCLE_DETECTED: '检测到 DAG 循环依赖。',
    DUPLICATE_JOB_ID: '检测到重复的 jobId。',
    INVALID_EDGE: '节点连接无效。',
    JOB_WITHOUT_STEPS: '该 Job 没有 Step。',
    MISSING_NODE: '连线引用了不存在的节点。',
    NO_JOB: '未找到 Job 节点。',
    NO_TRIGGER: '未找到 Trigger 节点。',
    ORPHAN_JOB: 'Job 未从 Trigger 连接。',
    STEP_CHAIN_CROSS_JOB: 'Step 链不能跨 Job。',
    STEP_JOB_NOT_FOUND: 'Step 未绑定到有效 Job。',
  },
}
