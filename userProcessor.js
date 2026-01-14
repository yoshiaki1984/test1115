/**
 * Complex function that processes user data
 * This function has multiple responsibilities and high complexity
 */
function processUserData(data, options) {
  // Validate and process user data
  if (data) {
    if (typeof data === 'object') {
      if (data.users && Array.isArray(data.users)) {
        let result = [];
        let errors = [];
        let stats = { total: 0, valid: 0, invalid: 0, processed: 0 };

        for (let i = 0; i < data.users.length; i++) {
          stats.total++;
          let user = data.users[i];

          if (user) {
            if (user.name && user.email) {
              // Validate email
              if (user.email.includes('@') && user.email.includes('.')) {
                // Check age
                if (user.age) {
                  if (typeof user.age === 'number') {
                    if (user.age >= 18 && user.age <= 120) {
                      // Process valid user
                      let processedUser = {
                        id: user.id || Math.random().toString(36).substring(2, 11),
                        name: user.name.trim(),
                        email: user.email.toLowerCase().trim(),
                        age: user.age,
                        status: 'active'
                      };

                      // Apply options
                      if (options) {
                        if (options.includeMetadata) {
                          processedUser.metadata = {
                            processedAt: new Date().toISOString(),
                            source: options.source || 'unknown'
                          };
                        }

                        if (options.formatName) {
                          if (options.formatName === 'uppercase') {
                            processedUser.name = processedUser.name.toUpperCase();
                          } else if (options.formatName === 'lowercase') {
                            processedUser.name = processedUser.name.toLowerCase();
                          } else if (options.formatName === 'capitalize') {
                            processedUser.name = processedUser.name.split(' ').map(word =>
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ');
                          }
                        }

                        if (options.filterByAge) {
                          if (user.age >= options.filterByAge.min && user.age <= options.filterByAge.max) {
                            result.push(processedUser);
                            stats.processed++;
                          } else {
                            errors.push({ user: user, reason: 'Age out of filter range' });
                          }
                        } else {
                          result.push(processedUser);
                          stats.processed++;
                        }
                      } else {
                        result.push(processedUser);
                        stats.processed++;
                      }

                      stats.valid++;
                    } else {
                      stats.invalid++;
                      errors.push({ user: user, reason: 'Age must be between 18 and 120' });
                    }
                  } else {
                    stats.invalid++;
                    errors.push({ user: user, reason: 'Age must be a number' });
                  }
                } else {
                  stats.invalid++;
                  errors.push({ user: user, reason: 'Age is required' });
                }
              } else {
                stats.invalid++;
                errors.push({ user: user, reason: 'Invalid email format' });
              }
            } else {
              stats.invalid++;
              errors.push({ user: user, reason: 'Name and email are required' });
            }
          } else {
            stats.invalid++;
            errors.push({ user: null, reason: 'User is null or undefined' });
          }
        }

        return {
          success: true,
          data: result,
          errors: errors,
          stats: stats
        };
      } else {
        return { success: false, error: 'users property must be an array' };
      }
    } else {
      return { success: false, error: 'data must be an object' };
    }
  } else {
    return { success: false, error: 'data is required' };
  }
}

module.exports = { processUserData };
