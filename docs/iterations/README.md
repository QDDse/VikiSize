# VikiSize 迭代文档

此目录保存每一轮产品迭代的过程材料，确保调研、需求变化、PRD 决策和技术影响可追溯。

## 目录规范

每轮使用一个日期和主题命名的目录：

```text
YYYY-MM-DD-short-topic/
  research.md
  requirements.md
  technical-impact.md
```

## 文档职责

- `research.md`：竞品、用户问题、事实来源、可复用模式和不采用的模式。
- `requirements.md`：本轮新增或修改的需求、优先级、范围、验收标准和待确认事项。
- `technical-impact.md`：对领域模型、数据、接口、页面、权限、迁移和测试的影响。

`docs/specs/` 中的 PRD 和技术方案仍是当前有效版本。迭代目录用于解释这些结论从哪里来、在何时发生变化。

## 聚合迭代

一次版本准备可能包含多轮调研。此时新增一个 `vX.Y-*-requirements` 聚合目录：

```text
YYYY-MM-DD-vX.Y-topic-requirements/
  README.md
  requirements.md
  decisions.md
  spec-plan.md
```

- 原始调研目录保留，不删除、不重复改写历史结论。
- 聚合目录的 `requirements.md` 是该版本后续生产 spec 的唯一需求输入。
- `decisions.md` 解决原始材料之间的范围冲突和优先级差异。
- `spec-plan.md` 只定义待生产 spec 的边界、顺序和进入条件，不提前代替 spec。

当前 v1.0 旅行聚合入口：`2026-07-01-v1.0-travel-requirements/`。
