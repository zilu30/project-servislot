import { useNavigate } from "react-router-dom";

export default function Categories() {
  const navigate = useNavigate();

  const categories = [
    "Home Services",
    "Repair & Maintenance",
    "Beauty & Personal Care",
    "Tutoring",
  ];

  const handleCategoryClick = (category) => {
    navigate("/booking", {
      state: { selectedCategory: category },
    });
  };

  return (
    <div>
      <h1>Select a Category</h1>

      {categories.map((category) => (
        <div
          key={category}
          onClick={() => handleCategoryClick(category)}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            margin: "10px 0",
            cursor: "pointer",
          }}
        >
          {category}
        </div>
      ))}
    </div>
  );
}