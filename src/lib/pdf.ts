// 이력서 PDF 텍스트 추출. mock AI 가 구조화 프로필을 만들 때만 사용한다.
// 실제 AI 연동 시에는 PDF 를 모델에 직접 전달하므로 이 함수는 필요 없다.
export async function extractPdfText(data: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  } catch {
    return "";
  }
}
