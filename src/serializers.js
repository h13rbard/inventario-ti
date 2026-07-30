'use strict';

function omitBranch(row) {
  if (!row) return row;
  const { branch, ...rest } = row;
  return rest;
}

function serializeCategory(row) {
  return omitBranch(row);
}

function serializeItem(row) {
  return omitBranch(row);
}

function serializeEmployee(row) {
  return omitBranch(row);
}

function serializeLoan(row) {
  return omitBranch(row);
}

function serializeMovement(row) {
  return omitBranch(row);
}

function serializeComputer(row) {
  const data = omitBranch(row);
  if (data.assignmentHistory == null) data.assignmentHistory = [];
  return data;
}

function serializeRecurso(row) {
  const data = typeof row.data === 'object' && row.data !== null ? { ...row.data } : {};
  return { id: row.id, ...data };
}

module.exports = {
  omitBranch,
  serializeCategory,
  serializeItem,
  serializeEmployee,
  serializeLoan,
  serializeMovement,
  serializeComputer,
  serializeRecurso,
};
