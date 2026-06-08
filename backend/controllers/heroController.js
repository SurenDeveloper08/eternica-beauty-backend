const Hero = require("../models/heroModel");

// ======================================
// CREATE HERO
// ======================================

exports.createHero = async (req, res) => {
    try {

        const BASE_URL =
            process.env.NODE_ENV === "production"
                ? process.env.BACKEND_URL
                : `${req.protocol}://${req.get("host")}`;

        const desktopImage =
            req.files?.desktopImage?.[0]
                ? `${BASE_URL}/uploads/hero/${req.files.desktopImage[0].filename}`
                : "";

        const mobileImage =
            req.files?.mobileImage?.[0]
                ? `${BASE_URL}/uploads/hero/${req.files.mobileImage[0].filename}`
                : "";

        const hero = await Hero.create({
            title: req.body.title,
            description: req.body.description || "",

            whatsappLink:
                req.body.whatsappLink || "",

            phoneNumber:
                req.body.phoneNumber || "",

            quoteButtonText:
                req.body.quoteButtonText || "Get Quote",

            callButtonText:
                req.body.callButtonText || "Call Now",

            desktopImage,
            mobileImage,

            isActive:
                req.body.isActive === "false"
                    ? false
                    : true,
        });

        res.status(201).json({
            success: true,
            data: hero,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// UPDATE HERO
// ======================================

exports.updateHero = async (req, res) => {
    try {

        const hero = await Hero.findById(
            req.params.id
        );

        if (!hero) {
            return res.status(404).json({
                success: false,
                message: "Hero not found",
            });
        }

        const BASE_URL =
            process.env.NODE_ENV === "production"
                ? process.env.BACKEND_URL
                : `${req.protocol}://${req.get("host")}`;

        hero.title =
            req.body.title || hero.title;

        hero.description =
            req.body.description ||
            hero.description;

        hero.whatsappLink =
            req.body.whatsappLink ||
            hero.whatsappLink;

        hero.phoneNumber =
            req.body.phoneNumber ||
            hero.phoneNumber;

        hero.quoteButtonText =
            req.body.quoteButtonText ||
            hero.quoteButtonText;

        hero.callButtonText =
            req.body.callButtonText ||
            hero.callButtonText;

        if (
            req.files?.desktopImage?.[0]
        ) {
            hero.desktopImage =
                `${BASE_URL}/uploads/hero/${req.files.desktopImage[0].filename}`;
        }

        if (
            req.files?.mobileImage?.[0]
        ) {
            hero.mobileImage =
                `${BASE_URL}/uploads/hero/${req.files.mobileImage[0].filename}`;
        }

        if (
            req.body.isActive !== undefined
        ) {
            hero.isActive =
                req.body.isActive === "true";
        }

        await hero.save();

        res.status(200).json({
            success: true,
            data: hero,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// GET ALL HEROES ADMIN
// ======================================

exports.getAllHeroes =
    async (req, res) => {
        try {
            const heroes =
                await Hero.find().sort({
                    createdAt: -1,
                });

            res.status(200).json({
                success: true,
                data: heroes,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    };

// ======================================
// GET WEBSITE HERO
// ======================================

exports.getWebsiteHero =
    async (req, res) => {
        try {
            const hero =
                await Hero.findOne({
                    isActive: true,
                });

            res.status(200).json({
                success: true,
                data: hero,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    };

// ======================================
// GET SINGLE HERO
// ======================================

exports.getSingleHero =
    async (req, res) => {
        try {
            const hero =
                await Hero.findById(
                    req.params.id
                );

            if (!hero) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hero not found",
                });
            }

            res.status(200).json({
                success: true,
                data: hero,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    };

// ======================================
// DELETE HERO
// ======================================

exports.deleteHero =
    async (req, res) => {
        try {
            const hero =
                await Hero.findById(
                    req.params.id
                );

            if (!hero) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hero not found",
                });
            }

            await Hero.findByIdAndDelete(
                req.params.id
            );

            res.status(200).json({
                success: true,
                message:
                    "Hero deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    };

// ======================================
// TOGGLE STATUS
// ======================================

exports.toggleHeroStatus =
    async (req, res) => {
        try {
            const hero =
                await Hero.findById(
                    req.params.id
                );

            if (!hero) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hero not found",
                });
            }

            hero.isActive =
                !hero.isActive;

            await hero.save();

            res.status(200).json({
                success: true,
                data: hero,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    };