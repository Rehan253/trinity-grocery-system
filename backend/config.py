class Config:
    """
    Application configuration.
    This file holds settings for database, Swagger, etc.
    """

    # PostgreSQL database connection string
    SQLALCHEMY_DATABASE_URI = (
        "postgresql+psycopg2://trinity_user:trinity123@localhost:5432/trinity_grocery"
    )

    # Disable SQLAlchemy event system (recommended)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Swagger configuration
    SWAGGER = {
        "title": "Trinity Grocery API",
        "uiversion": 3
    }
