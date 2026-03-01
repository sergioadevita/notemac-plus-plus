/**
 * ConfigureTasksDialogViewPresenter — Modal for creating/editing tasks.
 *
 * Provides a form for task definition and an import option for
 * .notemac/tasks.json configuration files.
 */

import React, { useState, useCallback } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import type { TaskDefinition } from '../Commons/Types';
import { AddNewTask, DeleteTask, LoadTasksFromConfig } from '../Controllers/TaskRunnerController';
import { ValidateTaskDefinition } from '../Services/TaskRunnerService';
import { generateId } from '../../Shared/Helpers/IdHelpers';
import { UI_ZINDEX_MODAL } from '../Commons/Constants';

interface ConfigureTasksDialogProps
{
    theme: ThemeColors;
    onClose: () => void;
}

const TASK_GROUPS = ['build', 'test', 'lint', 'custom'] as const;

export function ConfigureTasksDialogViewPresenter({ theme, onClose }: ConfigureTasksDialogProps)
{
    const { tasks } = useNotemacStore();
    const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonText, setJsonText] = useState('');

    const createEmptyTask = (): TaskDefinition => ({
        id: generateId(),
        label: '',
        command: '',
        group: 'custom',
        isDefault: false,
    });

    const handleAdd = () =>
    {
        setEditingTask(createEmptyTask());
        setFormErrors([]);
    };

    const handleEdit = (task: TaskDefinition) =>
    {
        setEditingTask({ ...task });
        setFormErrors([]);
    };

    const handleDelete = (taskId: string) =>
    {
        DeleteTask(taskId);
    };

    const handleSave = () =>
    {
        if (null === editingTask)
            return;

        const validation = ValidateTaskDefinition(editingTask);
        if (!validation.valid)
        {
            setFormErrors(validation.errors);
            return;
        }

        const result = AddNewTask(editingTask);
        if (result.success)
        {
            setEditingTask(null);
            setFormErrors([]);
        }
        else
        {
            setFormErrors(result.errors);
        }
    };

    const handleImportJson = useCallback(() =>
    {
        const count = LoadTasksFromConfig(jsonText);
        if (0 < count)
        {
            setJsonMode(false);
            setJsonText('');
        }
        else
        {
            setFormErrors(['Invalid JSON or no valid tasks found']);
        }
    }, [jsonText]);

    const handleFieldChange = (field: keyof TaskDefinition, value: string | boolean) =>
    {
        if (null === editingTask)
            return;
        setEditingTask({ ...editingTask, [field]: value });
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '4px 8px',
        background: theme.editorBg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        fontSize: 12,
        boxSizing: 'border-box',
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: UI_ZINDEX_MODAL,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: theme.sidebarBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    width: 520,
                    maxHeight: '80vh',
                    overflow: 'auto',
                    padding: 20,
                    color: theme.text,
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Configure Tasks</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: theme.text, fontSize: 18, cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                        onClick={() => setJsonMode(false)}
                        style={{
                            background: !jsonMode ? theme.accent : 'transparent',
                            color: !jsonMode ? theme.accentText : theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Task List
                    </button>
                    <button
                        onClick={() => setJsonMode(true)}
                        style={{
                            background: jsonMode ? theme.accent : 'transparent',
                            color: jsonMode ? theme.accentText : theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Import JSON
                    </button>
                </div>

                {jsonMode ? (
                    <div>
                        <textarea
                            value={jsonText}
                            onChange={e => setJsonText(e.target.value)}
                            placeholder={'{\n  "tasks": [\n    {\n      "id": "build",\n      "label": "Build Project",\n      "command": "npm run build",\n      "group": "build",\n      "isDefault": true\n    }\n  ]\n}'}
                            style={{
                                ...inputStyle,
                                height: 200,
                                fontFamily: "'SF Mono', monospace",
                                resize: 'vertical',
                            }}
                        />
                        <button
                            onClick={handleImportJson}
                            style={{
                                marginTop: 8,
                                background: theme.accent,
                                color: theme.accentText,
                                border: 'none',
                                borderRadius: 4,
                                padding: '6px 16px',
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Import Tasks
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Existing tasks */}
                        {0 === tasks.length && null === editingTask && (
                            <div style={{ opacity: 0.5, fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
                                No tasks configured yet.
                            </div>
                        )}

                        {tasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 8px',
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    background: theme.editorBg,
                                    gap: 8,
                                }}
                            >
                                <span style={{ fontSize: 10, opacity: 0.6 }}>
                                    [{task.group}]
                                </span>
                                <span style={{ flex: 1, fontSize: 12 }}>{task.label}</span>
                                <span style={{ fontSize: 10, opacity: 0.4 }}>{task.command}</span>
                                <button
                                    onClick={() => handleEdit(task)}
                                    style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: 11 }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 11 }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        {/* Edit form */}
                        {null !== editingTask && (
                            <div style={{
                                marginTop: 12,
                                padding: 12,
                                background: theme.editorBg,
                                borderRadius: 6,
                            }}>
                                <div style={{ marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Label</label>
                                    <input
                                        value={editingTask.label}
                                        onChange={e => handleFieldChange('label', e.target.value)}
                                        style={inputStyle}
                                        placeholder="Build Project"
                                    />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Command</label>
                                    <input
                                        value={editingTask.command}
                                        onChange={e => handleFieldChange('command', e.target.value)}
                                        style={inputStyle}
                                        placeholder="npm run build"
                                    />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Group</label>
                                    <select
                                        value={editingTask.group}
                                        onChange={e => handleFieldChange('group', e.target.value)}
                                        style={inputStyle}
                                    >
                                        {TASK_GROUPS.map(g => (
                                            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <label style={{ fontSize: 12 }}>
                                        <input
                                            type="checkbox"
                                            checked={editingTask.isDefault}
                                            onChange={e => handleFieldChange('isDefault', e.target.checked)}
                                        />
                                        {' '}Default task for this group
                                    </label>
                                </div>

                                {0 < formErrors.length && (
                                    <div style={{ color: '#ff4444', fontSize: 11, marginBottom: 8 }}>
                                        {formErrors.map((err, i) => <div key={i}>{err}</div>)}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            background: theme.accent,
                                            color: theme.accentText,
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '4px 12px',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setEditingTask(null); setFormErrors([]); }}
                                        style={{
                                            background: 'transparent',
                                            color: theme.text,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: 4,
                                            padding: '4px 12px',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {null === editingTask && (
                            <button
                                onClick={handleAdd}
                                style={{
                                    marginTop: 8,
                                    background: theme.accent,
                                    color: theme.accentText,
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '6px 16px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    width: '100%',
                                }}
                            >
                                + Add Task
                            </button>
                        )}
                    </div>
                )}

                {/* Show errors from JSON import */}
                {jsonMode && 0 < formErrors.length && (
                    <div style={{ color: '#ff4444', fontSize: 11, marginTop: 8 }}>
                        {formErrors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}
