import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity } from '@shared/schema';
import { 
  Upload,
  Edit,
  Search,
  Trash2
} from 'lucide-react';

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

const ActivityItem = ({ activity, index }: ActivityItemProps) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'upload':
        return {
          icon: Upload,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600'
        };
      case 'edit':
        return {
          icon: Edit,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600'
        };
      case 'query':
        return {
          icon: Search,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600'
        };
      case 'delete':
        return {
          icon: Trash2,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600'
        };
      default:
        return {
          icon: Edit,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600'
        };
    }
  };

  const getActivityTitle = () => {
    switch (activity.type) {
      case 'upload':
        return 'Document Uploaded';
      case 'edit':
        return 'Document Edited';
      case 'query':
        return 'Query Performed';
      case 'delete':
        return 'Document Deleted';
      default:
        return 'Activity';
    }
  };

  const { icon: Icon, bgColor, textColor } = getActivityIcon();
  const title = getActivityTitle();
  const isNew = index === 0;
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <motion.div 
      className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className={cn("rounded-full p-2 mt-1", bgColor, textColor)}>
        <Icon size={14} />
      </div>
      <div className="ml-3">
        <div className="flex items-center">
          <p className="font-medium text-sm">{title}</p>
          {isNew && (
            <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">New</span>
          )}
        </div>
        <p className="text-sm text-muted mt-1">{activity.details}</p>
        <p className="text-xs text-muted mt-1">{timeAgo}</p>
      </div>
    </motion.div>
  );
};

export default ActivityItem;
