class ParseUtils {
  static checkTime(time: string): boolean {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }

  static checkInterval(time: string): boolean {
    const regex = /^\d+$/;
    return regex.test(time);
  }

  static checkTimeZone(tz: string): boolean {
    const regex = /^\w+\/\w+$/;
    return regex.test(tz);
  }
}

export default ParseUtils;
