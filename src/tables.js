const schoolTables = [
  {
    name: "classes",
    title: "Classes",
    description: "View class records and basic class information."
  },
  {
    name: "students",
    title: "Students",
    description: "Track student records from your academic database."
  },
  {
    name: "teachers",
    title: "Teachers",
    description: "See the teacher list and related details."
  },
  {
    name: "subjects",
    title: "Subjects",
    description: "Browse the subjects available in the school."
  },
  {
    name: "subjects_teachers",
    title: "Subject Teachers",
    description: "Check which teachers are linked to each subject."
  },
  {
    name: "marks",
    title: "Marks",
    description: "Review grading records and academic performance."
  },
  {
    name: "attendance",
    title: "Attendance",
    description: "Monitor attendance records and presence data."
  }
];

function isAllowedTable(tableName) {
  return schoolTables.some((table) => table.name === tableName);
}

function getTableMeta(tableName) {
  return schoolTables.find((table) => table.name === tableName);
}

module.exports = {
  schoolTables,
  isAllowedTable,
  getTableMeta
};
