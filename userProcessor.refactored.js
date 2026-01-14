/**
 * Refactored version - breaking down complex function into smaller, focused functions
 */

// Validation functions
function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.includes('.');
}

function isValidAge(age) {
  return typeof age === 'number' && age >= 18 && age <= 120;
}

function validateUser(user) {
  if (!user) {
    return { valid: false, reason: 'User is null or undefined' };
  }

  if (!user.name || !user.email) {
    return { valid: false, reason: 'Name and email are required' };
  }

  if (!isValidEmail(user.email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  if (!user.age) {
    return { valid: false, reason: 'Age is required' };
  }

  if (!isValidAge(user.age)) {
    return { valid: false, reason: 'Age must be between 18 and 120' };
  }

  return { valid: true };
}

// Formatting functions
function formatName(name, formatOption) {
  const trimmedName = name.trim();

  switch (formatOption) {
    case 'uppercase':
      return trimmedName.toUpperCase();
    case 'lowercase':
      return trimmedName.toLowerCase();
    case 'capitalize':
      return trimmedName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    default:
      return trimmedName;
  }
}

function generateUserId(existingId) {
  return existingId || Math.random().toString(36).substring(2, 11);
}

// Transformation function
function transformUser(user, options = {}) {
  const processedUser = {
    id: generateUserId(user.id),
    name: formatName(user.name, options.formatName),
    email: user.email.toLowerCase().trim(),
    age: user.age,
    status: 'active'
  };

  if (options.includeMetadata) {
    processedUser.metadata = {
      processedAt: new Date().toISOString(),
      source: options.source || 'unknown'
    };
  }

  return processedUser;
}

// Filtering function
function shouldIncludeUser(user, ageFilter) {
  if (!ageFilter) {
    return true;
  }

  const { min, max } = ageFilter;
  return user.age >= min && user.age <= max;
}

// Input validation
function validateInput(data) {
  if (!data) {
    return { valid: false, error: 'data is required' };
  }

  if (typeof data !== 'object') {
    return { valid: false, error: 'data must be an object' };
  }

  if (!data.users || !Array.isArray(data.users)) {
    return { valid: false, error: 'users property must be an array' };
  }

  return { valid: true };
}

// Statistics tracking
function createStatsTracker() {
  return {
    total: 0,
    valid: 0,
    invalid: 0,
    processed: 0
  };
}

// Main processing function - now much simpler and more readable
function processUserData(data, options = {}) {
  // Validate input structure
  const inputValidation = validateInput(data);
  if (!inputValidation.valid) {
    return { success: false, error: inputValidation.error };
  }

  const result = [];
  const errors = [];
  const stats = createStatsTracker();

  // Process each user
  for (const user of data.users) {
    stats.total++;

    // Validate user
    const validation = validateUser(user);
    if (!validation.valid) {
      stats.invalid++;
      // Match original behavior: use null for null/undefined users
      errors.push({ user: user || null, reason: validation.reason });
      continue;
    }

    stats.valid++;

    // Transform user
    const processedUser = transformUser(user, options);

    // Apply age filter if specified
    if (shouldIncludeUser(processedUser, options.filterByAge)) {
      result.push(processedUser);
      stats.processed++;
    } else {
      errors.push({ user, reason: 'Age out of filter range' });
    }
  }

  return {
    success: true,
    data: result,
    errors,
    stats
  };
}

module.exports = {
  processUserData,
  // Export helper functions for testing
  validateUser,
  isValidEmail,
  isValidAge,
  formatName,
  transformUser,
  shouldIncludeUser
};
