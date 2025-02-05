import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState('');

  const features = [
    {
      icon: HomeIcon,
      title: "Easy to Use",
      description: "Create your listing in minutes and connect with potential roommates"
    },
    {
      icon: AcademicCapIcon,
      title: "University Focused",
      description: "Find roommates from your university or nearby institutions"
    },
    {
      icon: UserGroupIcon,
      title: "Personality Match",
      description: "Match with roommates based on lifestyle and preferences"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure Platform",
      description: "Safe and verified user profiles for peace of mind"
    }
  ];

  const handleSearch = () => {
    if (selectedUniversity) {
      navigate(`/browse?university=${encodeURIComponent(selectedUniversity)}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">

    </div>
  );
};

export default Home;
