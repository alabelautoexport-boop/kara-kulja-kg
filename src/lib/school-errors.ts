export function schoolRpcError(error: { code?: string; message?: string }) {
  if (error.message?.includes("Revision conflict"))
    return "Данные изменились. Откройте школу заново.";
  if (error.code === "42501")
    return "Недостаточно прав. Войдите заново или обратитесь к администратору.";
  if (error.code === "P0002") return "Школа не найдена. Обновите список.";
  if (error.code === "PGRST202")
    return "Требуется новая миграция Schools. Обратитесь к администратору.";
  if (error.message?.includes("School archived")) return "Школа в архиве. Сначала восстановите её.";
  if (error.message?.includes("Under review"))
    return "Изменения на проверке. Дождитесь решения администратора.";
  if (error.code === "23505") return "Такой slug уже существует. Укажите другой.";
  if (error.code?.startsWith("22") || error.code === "23514" || error.code === "23502")
    return "Проверьте поля формы. Сервер отклонил некорректные данные.";
  return "Не удалось сохранить изменения. Повторите попытку. Если ошибка повторится, обратитесь к администратору.";
}
