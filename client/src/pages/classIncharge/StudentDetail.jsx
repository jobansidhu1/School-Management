import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const dummyTests = [
  { id: 1, testName: 'Midterm Exam', date: '2023-10-15', maxMarks: 100, obtainedMarks: 85, grade: 'A' },
  { id: 2, testName: 'Quiz 1', date: '2023-09-10', maxMarks: 20, obtainedMarks: 18, grade: 'A' },
  { id: 3, testName: 'Assignment 1', date: '2023-09-25', maxMarks: 50, obtainedMarks: 45, grade: 'A' },
];

const dummyStudents = {
  '101': { name: 'Michael Brown', rollno: '10' },
  '102': { name: 'Emily Davis', rollno: '11' },
  '103': { name: 'Daniel Wilson', rollno: '12' },
};

const StudentDetail = () => {
  const { subjectId, studentId } = useParams();
  const navigate = useNavigate();

  const student = dummyStudents[studentId] || { name: 'Unknown Student', rollno: 'N/A' };
  const subjectName = subjectId === '1' ? 'Mathematics' : subjectId === '2' ? 'Science' : 'English';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <h2>{student.name} ({student.rollno})</h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Full Test Sheet for {subjectName}</p>
        </div>
        <button 
          onClick={() => navigate(`/class-incharge/my-class/subject/${subjectId}`)}
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '500' }}
        >
          Back to Students List
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>S.No</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Test Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Max Marks</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Obtained Marks</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Grade</th>
            </tr>
            </thead>
            <tbody>
            {dummyTests.map((test, index) => (
                <tr key={test.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{index + 1}</td>
                <td style={{ padding: '12px', fontWeight: '500' }}>{test.testName}</td>
                <td style={{ padding: '12px' }}>{test.date}</td>
                <td style={{ padding: '12px' }}>{test.maxMarks}</td>
                <td style={{ padding: '12px', fontWeight: '600', color: '#0ea5e9' }}>{test.obtainedMarks}</td>
                <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e3a8a', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: '600' }}>
                        {test.grade}
                    </span>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDetail;
