export const getUserDisplayName = (user) => {
  if (!user) return '';
  const lastName = user.last_name || '';
  const firstName = user.first_name || '';

  const baseName =
    lastName && firstName
      ? `${lastName}${firstName}`
      : lastName || firstName || '';

  if (baseName && user.username) return `${baseName} (${user.username})`;
  if (baseName) return baseName;

  return user.username || user.email || '';
};
