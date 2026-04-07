// HH:mm → ISO文字列生成
export const toISODateTime = (date: string, time: string): string =>
  `${date}T${time}:00+09:00`;
