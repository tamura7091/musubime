// Utility functions for submission counting (client-safe, no Node.js dependencies)

export function getSubmissionCount(logStatus?: string, targetStatus?: string): number {
  if (!logStatus) return 0;
  
  try {
    const logArray = JSON.parse(logStatus);
    if (!Array.isArray(logArray)) return 0;
    
    // Count how many times the status changed to the target status
    // If no target status provided, count all status changes
    if (targetStatus) {
      return logArray.filter((entry: any) => entry.new_status === targetStatus).length;
    }
    
    return logArray.length;
  } catch (error) {
    console.error('Failed to parse log_status:', error);
    return 0;
  }
}

// Get submission count text in Japanese
export function getSubmissionCountText(logStatus?: string, targetStatus?: string): string {
  const count = getSubmissionCount(logStatus, targetStatus);
  
  if (count === 0) return '';
  if (count === 1) return '初回の提出';
  return `${count}回目の提出`;
}

