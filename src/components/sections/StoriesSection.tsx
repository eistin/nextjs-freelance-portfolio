"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

export default function StoriesSection() {
  const t = useTranslations("stories");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [savedStories, setSavedStories] = useState<string[]>([]);

  const stories = [
    {
      key: "landing",
      featured: true,
      views: "2.4k",
      likes: 127,
      comments: 23,
      author: {
        name: "Turjo S.",
        avatar: "/photo.svg",
      },
      tags: ["Performance", "Best Practices", "DevOps"],
    },
    {
      key: "career1",
      featured: false,
      views: "1.8k",
      likes: 89,
      comments: 15,
      author: {
        name: "Turjo S.",
        avatar: "/photo.svg",
      },
      tags: ["Career", "Growth", "Learning"],
    },
    {
      key: "career2",
      featured: false,
      views: "1.2k",
      likes: 64,
      comments: 12,
      author: {
        name: "Turjo S.",
        avatar: "/photo.svg",
      },
      tags: ["DevOps", "Automation", "Tools"],
    },
  ];

  const toggleSave = (storyKey: string) => {
    setSavedStories((prev) =>
      prev.includes(storyKey)
        ? prev.filter((k) => k !== storyKey)
        : [...prev, storyKey]
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section className="container mx-auto" ref={ref}>
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-bold mb-4">{t("title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Featured Story - Spans 7 columns */}
        <motion.div className="lg:col-span-7" variants={itemVariants}>
          <Card className="group h-full cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              {/* Featured image placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
                🖼️
              </div>
              {/* TODO: Replace with actual blog image */}

              {/* Category badge */}
              <div className="absolute top-6 left-6">
                <Badge className="bg-primary text-primary-foreground">
                  {t(`items.${stories[0].key}.category`)}
                </Badge>
              </div>

              {/* Save button */}
              <motion.button
                className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSave(stories[0].key)}
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${
                    savedStories.includes(stories[0].key)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            </div>

            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span>{t(`items.${stories[0].key}.date`)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>8 {t("readTime")}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{stories[0].views}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                {t(`items.${stories[0].key}.title`)}
              </h3>

              <p className="text-muted-foreground mb-6 line-clamp-3">
                {t(`items.${stories[0].key}.description`)}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {stories[0].tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Author and engagement */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={stories[0].author.avatar} />
                    <AvatarFallback>TS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {stories[0].author.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("authorRole")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{stories[0].likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{stories[0].comments}</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Side Stories - Spans 5 columns */}
        <div className="lg:col-span-5 space-y-6">
          {stories.slice(1).map((story) => (
            <motion.div key={story.key} variants={itemVariants}>
              <Card className="group cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="flex">
                  <div className="relative w-40 bg-muted">
                    {/* Thumbnail placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-20">
                      🖼️
                    </div>
                    {/* TODO: Replace with actual blog thumbnail */}
                  </div>

                  <CardContent className="flex-1 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {t(`items.${story.key}.category`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        5 {t("readTime")}
                      </span>
                    </div>

                    <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {t(`items.${story.key}.title`)}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {t(`items.${story.key}.description`)}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t(`items.${story.key}.date`)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-auto p-0"
                      >
                        {t("readMore")} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Newsletter CTA */}
          <motion.div variants={itemVariants}>
            <Card className="bg-primary text-primary-foreground border-0">
              <CardContent className="p-6 text-center">
                <h4 className="font-bold mb-2">{t("stayUpdated")}</h4>
                <p className="text-sm text-primary-foreground/90 mb-4">
                  {t("newsletterDescription")}
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  {t("subscribeNewsletter")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* View All Button */}
      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button variant="outline" size="lg" className="gap-2">
          {t("viewAllArticles")} <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </section>
  );
}
