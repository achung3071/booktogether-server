import { Document } from "mongoose";
export default function updateQueryResults(
  resultArr: Document[],
  updateArr: Document[]
): Document[] {
  if (!resultArr) {
    return updateArr;
  } else {
    return updateArr.filter((a: any) => {
      return resultArr.some((b: any) => b.id === a.id);
    });
  }
}
