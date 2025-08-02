// This file is not imported by any other file (orphaned)
// It will be detected by the analyze_dependencies tool

function unusedFunction() {
  console.log('This function is never called');
}

function anotherUnusedFunction() {
  return {
    status: 'orphaned',
    message: 'This module is not imported anywhere'
  };
}

module.exports = {
  unusedFunction,
  anotherUnusedFunction
};