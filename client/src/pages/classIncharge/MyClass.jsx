import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { getTeachersThunk } from '../../redux/slices/teacherSlice';
import {
  fetchClassInchargeDashboard,
  assignSubjectTeacherApi,
  fetchClassSubjectsApi,
  createClassSubjectApi,
  updateClassSubjectApi,
  deleteClassSubjectApi,
  createTeacherCredentialsApi,
} from '../../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  UserPlus,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

const MyClass = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { teachers } = useAppSelector((state) => state.teachers);

  const [subjects, setSubjects] = useState([]);          // [{name, assignedTeacherId, assignedTeacherName}]
  const [loading, setLoading] = useState(true);
  const [assignedClassInfo, setAssignedClassInfo] = useState(null);
  const [saving, setSaving] = useState({});
  const [statusMsg, setStatusMsg] = useState({});

  // Subject CRUD state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [editingIndex, setEditingIndex] = useState(null);  // index being edited
  const [editValue, setEditValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingIndex, setDeletingIndex] = useState(null);

  // Create Teacher Credentials State
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ teacherId: '', password: '' });
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [createTeacherError, setCreateTeacherError] = useState('');
  const [createTeacherSuccess, setCreateTeacherSuccess] = useState('');

  // Get unique assigned teachers for the dropdown
  const assignedTeachers = React.useMemo(() => {
    const map = new Map();
    subjects.forEach((sub) => {
      if (sub.assignedTeacherId) {
        map.set(sub.assignedTeacherId, sub.assignedTeacherName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [subjects]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setCreateTeacherError('');
    setCreateTeacherSuccess('');
    
    if (!newTeacher.teacherId || !newTeacher.password) {
      setCreateTeacherError('Please select a teacher and enter a password.');
      return;
    }
    if (newTeacher.password.length < 6) {
      setCreateTeacherError('Password must be at least 6 characters.');
      return;
    }

    setCreatingTeacher(true);
    try {
      const res = await createTeacherCredentialsApi(newTeacher);
      if (res.success) {
        setCreateTeacherSuccess('Teacher credentials created successfully!');
        setNewTeacher({ teacherId: '', password: '' });
        setTimeout(() => {
          setShowCreateTeacher(false);
          setCreateTeacherSuccess('');
        }, 2000);
      }
    } catch (err) {
      setCreateTeacherError(err.response?.data?.message || 'Failed to create credentials.');
    } finally {
      setCreatingTeacher(false);
    }
  };

  // Load dashboard (teacher assignments) and subjects list together
  const loadAll = async () => {
    try {
      const [dashRes, subRes] = await Promise.all([
        fetchClassInchargeDashboard(),
        fetchClassSubjectsApi(),
      ]);

      if (dashRes.success) {
        setAssignedClassInfo(dashRes.assignedClass);
        const dbSubjects = subRes.success ? subRes.subjects : [];
        // Merge DB subjects with existing assignments
        const merged = dbSubjects.map((name) => {
          const assignment = dashRes.subjectTeachers?.find((st) => st.subject === name);
          return {
            name,
            assignedTeacherId: assignment?.teacher?._id || '',
            assignedTeacherName: assignment?.teacher?.name || '',
          };
        });
        setSubjects(merged);
      }
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(getTeachersThunk({ limit: 1000 }));
    loadAll();
  }, [dispatch]);

  // ── Teacher Assignment ───────────────────────────────────────────────────────
  const handleTeacherChange = (index, value) => {
    setSubjects((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, assignedTeacherId: value } : sub))
    );
  };

  const handleSaveTeacher = async (subject, index) => {
    if (!subject.assignedTeacherId) {
      setStatusMsg((prev) => ({ ...prev, [index]: 'Error: Please select a teacher.' }));
      return;
    }
    setSaving((prev) => ({ ...prev, [index]: true }));
    setStatusMsg((prev) => ({ ...prev, [index]: '' }));
    try {
      const res = await assignSubjectTeacherApi({
        subject: subject.name,
        teacherId: subject.assignedTeacherId,
      });
      if (res.success && res.assignment?.teacher) {
        setSubjects((prev) =>
          prev.map((sub, i) =>
            i === index ? { ...sub, assignedTeacherName: res.assignment.teacher.name } : sub
          )
        );
      }
      setStatusMsg((prev) => ({ ...prev, [index]: 'Saved!' }));
      await loadAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save.';
      setStatusMsg((prev) => ({ ...prev, [index]: `Error: ${msg}` }));
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  };

  // ── Subject Create ───────────────────────────────────────────────────────────
  const handleAddSubject = async () => {
    setAddError('');
    setAddSuccess('');
    const trimmed = newSubjectName.trim();
    if (!trimmed) { setAddError('Subject name cannot be empty.'); return; }
    setAddingSubject(true);
    try {
      const res = await createClassSubjectApi(trimmed);
      if (res.success) {
        setNewSubjectName('');
        setAddSuccess('Subject added!');
        await loadAll();
        setTimeout(() => setAddSuccess(''), 3000);
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add subject.');
    } finally {
      setAddingSubject(false);
    }
  };

  // ── Subject Edit ─────────────────────────────────────────────────────────────
  const startEdit = (index, currentName) => {
    setEditingIndex(index);
    setEditValue(currentName);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
    setEditError('');
  };

  const handleSaveEdit = async (index) => {
    setEditError('');
    const trimmed = editValue.trim();
    if (!trimmed) { setEditError('Name cannot be empty.'); return; }
    setEditSaving(true);
    try {
      const res = await updateClassSubjectApi(index, trimmed);
      if (res.success) {
        setEditingIndex(null);
        await loadAll();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Subject Delete ───────────────────────────────────────────────────────────
  const handleDeleteSubject = async (index) => {
    if (!window.confirm(`Delete subject "${subjects[index]?.name}"? This cannot be undone.`)) return;
    setDeletingIndex(index);
    try {
      await deleteClassSubjectApi(index);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subject.');
    } finally {
      setDeletingIndex(null);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const th = { padding: '12px 14px', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', gap: '10px' }}>
        <div style={{ width: '22px', height: '22px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading subjects...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">My Class Subjects</h1>
          {assignedClassInfo && (
            <p className="page-subtitle">
              Assigned Class: <strong style={{ color: '#0f172a' }}>{assignedClassInfo.name}</strong>
              {assignedClassInfo.section && assignedClassInfo.section !== 'A' && (
                <span> &mdash; Section: <strong style={{ color: '#0f172a' }}>{assignedClassInfo.section}</strong></span>
              )}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateTeacher(!showCreateTeacher)}
            className="tch-btn tch-btn-outline"
          >
            {showCreateTeacher ? <X size={15} /> : <UserPlus size={15} />}
            <span>{showCreateTeacher ? 'Cancel' : 'Create Teacher Credentials'}</span>
          </button>
        </div>
      </div>

      {/* ── Create Teacher Form ── */}
      {showCreateTeacher && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>Create Subject Teacher Credentials</p>
          <form onSubmit={handleCreateTeacher} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={newTeacher.teacherId}
              onChange={(e) => setNewTeacher({ ...newTeacher, teacherId: e.target.value })}
              disabled={creatingTeacher}
              style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white' }}
            >
              <option value="">-- Select Assigned Teacher --</option>
              {assignedTeachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={newTeacher.password}
              onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
              disabled={creatingTeacher}
              style={{ flex: 1, minWidth: '150px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={creatingTeacher}
              className="tch-btn tch-btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              {creatingTeacher ? 'Creating...' : 'Create Credentials'}
            </button>
          </form>
          {createTeacherError && <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: '0.82rem' }}>{createTeacherError}</p>}
          {createTeacherSuccess && <p style={{ margin: '8px 0 0', color: '#16a34a', fontSize: '0.82rem', fontWeight: '600' }}>✓ {createTeacherSuccess}</p>}
        </div>
      )}

      {/* ── Add Subject Form ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>Add New Subject</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Subject name (e.g. Mathematics, Physics)"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            disabled={addingSubject}
            style={{
              flex: 1, minWidth: '220px', padding: '8px 14px', borderRadius: '8px',
              border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none',
              background: '#ffffff',
            }}
          />
          <button
            onClick={handleAddSubject}
            disabled={addingSubject || !newSubjectName.trim()}
            className="tch-btn tch-btn-primary"
            style={{
              opacity: addingSubject || !newSubjectName.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} />
            <span>{addingSubject ? 'Adding...' : 'Add Subject'}</span>
          </button>
        </div>
        {addError && <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: '0.82rem' }}>{addError}</p>}
        {addSuccess && <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '0.82rem', fontWeight: '600' }}>✓ {addSuccess}</p>}
      </div>

      {/* ── Subjects Table ── */}
      {subjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <BookOpen size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <p style={{ fontSize: '1rem', margin: 0, fontWeight: '500' }}>No subjects added yet. Add your first subject above.</p>
        </div>
      ) : (
        <div className="tch-table-card">
          <div className="tch-table-wrapper">
            <table className="tch-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Subject Name</th>
                  <th>Assigned Teacher</th>
                  <th>Assign Teacher</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index}>
                    {/* S.No */}
                    <td style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.82rem' }}>{index + 1}</td>

                    {/* Subject Name / Edit inline */}
                    <td>
                      {editingIndex === index ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(index); if (e.key === 'Escape') cancelEdit(); }}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #2563eb', fontSize: '0.85rem', outline: 'none', width: '160px' }}
                          />
                          <button onClick={() => handleSaveEdit(index)} disabled={editSaving}
                            className="tch-btn tch-btn-primary"
                            style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                            {editSaving ? '...' : 'Save'}
                          </button>
                          <button onClick={cancelEdit}
                            className="tch-btn tch-btn-outline"
                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                          {editError && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{editError}</span>}
                        </div>
                      ) : (
                        <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{subject.name}</span>
                      )}
                    </td>

                    {/* Currently assigned teacher */}
                    <td>
                      {subject.assignedTeacherName ? (
                        <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: '600', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> {subject.assignedTeacherName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Teacher select + save */}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          value={subject.assignedTeacherId}
                          onChange={(e) => handleTeacherChange(index, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', maxWidth: '220px', outline: 'none', background: '#ffffff' }}
                        >
                          <option value="">-- Select Teacher --</option>
                          {teachers?.map((teacher) => (
                            <option key={teacher._id || teacher.teacherId} value={teacher._id || teacher.teacherId}>
                              {teacher.fullName} ({teacher.email})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveTeacher(subject, index)}
                          disabled={saving[index]}
                          className="tch-btn tch-btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                        >
                          {saving[index] ? 'Saving...' : 'Assign'}
                        </button>
                        {statusMsg[index] && (
                          <span style={{ fontSize: '0.78rem', color: statusMsg[index].startsWith('Error') ? '#ef4444' : '#15803d', fontWeight: '600' }}>
                            {statusMsg[index]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Edit / Delete */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="tch-action-buttons">
                        <button
                          onClick={() => startEdit(index, subject.name)}
                          disabled={editingIndex !== null}
                          title="Edit subject name"
                          className="tch-action-btn edit"
                          style={{ opacity: editingIndex !== null && editingIndex !== index ? 0.4 : 1 }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(index)}
                          disabled={deletingIndex === index}
                          title="Delete subject"
                          className="tch-action-btn delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MyClass;
