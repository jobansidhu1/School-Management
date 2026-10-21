import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const dummyStudents = [
  { id: 101, name: 'Michael Brown', rollno: '10', recentMarks: '85/100' },
  { id: 102, name: 'Emily Davis', rollno: '11', recentMarks: '92/100' },
  { id: 103, name: 'Daniel Wilson', rollno: '12', recentMarks: '78/100' },
];

const SubjectDetail = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  // Normally we would fetch subject details using subjectId, hardcoding name for now.
  const subjectName = subjectId === '1' ? 'Mathematics' : subjectId === '2' ? 'Science' : 'English';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <h2>{subjectName}</h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Students and their recent performance</p>
        </div>
        <button 
          onClick={() => navigate('/class-incharge/my-class')}
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '500' }}
        >
          Back to Subjects
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>S.No</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Roll No</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Recent Marks</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dummyStudents.map((student, index) => (
            <tr key={student.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px' }}>{index + 1}</td>
              <td style={{ padding: '12px', fontWeight: '500' }}>{student.name}</td>
              <td style={{ padding: '12px' }}>{student.rollno}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '9999px', fontSize: '14px', fontWeight: '500' }}>
                    {student.recentMarks}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button 
                  onClick={() => navigate(`/class-incharge/my-class/subject/${subjectId}/student/${student.id}`)}
                  style={{ padding: '6px 16px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }}
                >
                  Full Sheet
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectDetail;
