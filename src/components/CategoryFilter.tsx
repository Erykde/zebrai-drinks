interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

const CategoryFilter = ({ categories, selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat
              ? 'bg-primary text-primary-foreground shadow-gold'
              : 'bg-muted text-muted-foreground hover:bg-primary/20'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
