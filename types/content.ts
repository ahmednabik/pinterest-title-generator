export type Content = {
  title: string;
  introduction: string;
  subtopics: {
    subtopicId: string;
    subheading: string;
    imageUrl: string;
    description: string;
  }[];
};
