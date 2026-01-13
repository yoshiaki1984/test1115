/**
 * Tests to verify that the refactored version maintains the same behavior
 */

const { processUserData: processOriginal } = require('./userProcessor');
const { processUserData: processRefactored } = require('./userProcessor.refactored');

function assertEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);

  if (actualStr !== expectedStr) {
    console.error(`FAIL: ${message}`);
    console.error('Expected:', expectedStr);
    console.error('Actual:', actualStr);
    return false;
  }

  console.log(`PASS: ${message}`);
  return true;
}

function normalizeResult(result) {
  // Normalize IDs since they're randomly generated
  if (result.data) {
    result.data = result.data.map(user => ({
      ...user,
      id: 'normalized-id'
    }));
  }

  // Normalize errors with user objects
  if (result.errors) {
    result.errors = result.errors.map(error => ({
      ...error,
      user: error.user ? { ...error.user, id: error.user.id ? 'normalized-id' : undefined } : error.user
    }));
  }

  return result;
}

// Test cases
function runTests() {
  console.log('Running tests to verify refactored version maintains same behavior...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Valid user data
  const test1Data = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com', age: 25 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 30 }
    ]
  };

  const result1Original = normalizeResult(processOriginal(test1Data));
  const result1Refactored = normalizeResult(processRefactored(test1Data));

  if (assertEqual(result1Refactored, result1Original, 'Test 1: Valid user data')) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Invalid email
  const test2Data = {
    users: [
      { name: 'Invalid User', email: 'invalid-email', age: 25 }
    ]
  };

  const result2Original = normalizeResult(processOriginal(test2Data));
  const result2Refactored = normalizeResult(processRefactored(test2Data));

  if (assertEqual(result2Refactored, result2Original, 'Test 2: Invalid email')) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Age out of range
  const test3Data = {
    users: [
      { name: 'Too Young', email: 'young@example.com', age: 15 },
      { name: 'Too Old', email: 'old@example.com', age: 150 }
    ]
  };

  const result3Original = normalizeResult(processOriginal(test3Data));
  const result3Refactored = normalizeResult(processRefactored(test3Data));

  if (assertEqual(result3Refactored, result3Original, 'Test 3: Age out of range')) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Missing required fields
  const test4Data = {
    users: [
      { name: 'No Email', age: 25 },
      { email: 'noemail@example.com', age: 30 }
    ]
  };

  const result4Original = normalizeResult(processOriginal(test4Data));
  const result4Refactored = normalizeResult(processRefactored(test4Data));

  if (assertEqual(result4Refactored, result4Original, 'Test 4: Missing required fields')) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: With options - format name uppercase
  const test5Data = {
    users: [
      { name: 'john doe', email: 'john@example.com', age: 25 }
    ]
  };
  const test5Options = { formatName: 'uppercase' };

  const result5Original = normalizeResult(processOriginal(test5Data, test5Options));
  const result5Refactored = normalizeResult(processRefactored(test5Data, test5Options));

  if (assertEqual(result5Refactored, result5Original, 'Test 5: Format name uppercase')) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: With options - capitalize
  const test6Data = {
    users: [
      { name: 'john doe smith', email: 'john@example.com', age: 25 }
    ]
  };
  const test6Options = { formatName: 'capitalize' };

  const result6Original = normalizeResult(processOriginal(test6Data, test6Options));
  const result6Refactored = normalizeResult(processRefactored(test6Data, test6Options));

  if (assertEqual(result6Refactored, result6Original, 'Test 6: Format name capitalize')) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: With metadata option
  const test7Data = {
    users: [
      { name: 'John Doe', email: 'john@example.com', age: 25 }
    ]
  };
  const test7Options = { includeMetadata: true, source: 'test' };

  const result7Original = normalizeResult(processOriginal(test7Data, test7Options));
  const result7Refactored = normalizeResult(processRefactored(test7Data, test7Options));

  // Metadata includes timestamp, so we need to check structure rather than exact match
  const metadataMatch = result7Original.data.length === result7Refactored.data.length &&
    result7Original.data[0].metadata && result7Refactored.data[0].metadata &&
    result7Original.data[0].metadata.source === result7Refactored.data[0].metadata.source;

  if (metadataMatch) {
    console.log('PASS: Test 7: With metadata option');
    passed++;
  } else {
    console.error('FAIL: Test 7: With metadata option');
    failed++;
  }

  // Test 8: Age filter
  const test8Data = {
    users: [
      { name: 'Young', email: 'young@example.com', age: 20 },
      { name: 'Middle', email: 'middle@example.com', age: 35 },
      { name: 'Older', email: 'older@example.com', age: 50 }
    ]
  };
  const test8Options = { filterByAge: { min: 25, max: 40 } };

  const result8Original = normalizeResult(processOriginal(test8Data, test8Options));
  const result8Refactored = normalizeResult(processRefactored(test8Data, test8Options));

  if (assertEqual(result8Refactored, result8Original, 'Test 8: Age filter')) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: Null/undefined users
  const test9Data = {
    users: [null, undefined, { name: 'Valid', email: 'valid@example.com', age: 25 }]
  };

  const result9Original = normalizeResult(processOriginal(test9Data));
  const result9Refactored = normalizeResult(processRefactored(test9Data));

  if (assertEqual(result9Refactored, result9Original, 'Test 9: Null/undefined users')) {
    passed++;
  } else {
    failed++;
  }

  // Test 10: Invalid input - no data
  const result10Original = processOriginal(null);
  const result10Refactored = processRefactored(null);

  if (assertEqual(result10Refactored, result10Original, 'Test 10: No data')) {
    passed++;
  } else {
    failed++;
  }

  // Test 11: Invalid input - not an object
  const result11Original = processOriginal('invalid');
  const result11Refactored = processRefactored('invalid');

  if (assertEqual(result11Refactored, result11Original, 'Test 11: Invalid data type')) {
    passed++;
  } else {
    failed++;
  }

  // Test 12: Invalid input - users not array
  const test12Data = { users: 'not an array' };
  const result12Original = processOriginal(test12Data);
  const result12Refactored = processRefactored(test12Data);

  if (assertEqual(result12Refactored, result12Original, 'Test 12: Users not an array')) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n✓ All tests passed! Refactored version maintains same behavior.');
    process.exit(0);
  } else {
    console.error('\n✗ Some tests failed!');
    process.exit(1);
  }
}

runTests();
