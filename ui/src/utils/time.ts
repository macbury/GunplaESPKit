export async function sleep(timeout : number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  })
}

export function convertMillisecondsToTime(milliseconds: number): string {
  if (!milliseconds) {
    return null;
  }

  const seconds = Math.floor((milliseconds / 1000) % 60)
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24)
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))

  const timeParts = []
  if (days > 0) {
    timeParts.push(`${days}d`)
  }
  if (hours > 0) {
    timeParts.push(`${hours}h`)
  }
  if (minutes > 0) {
    timeParts.push(`${minutes}m`)
  }
  if (seconds > 0) {
    timeParts.push(`${seconds}s`)
  }

  return timeParts.join(' ')
}
